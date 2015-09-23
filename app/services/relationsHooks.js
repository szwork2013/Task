var utilities = require('./utilities');
var metamodel = require('../metamodel');

var entityModels;

function apply(models) {

    entityModels = models.models;
    metamodel.associations.forEach(function (association) {

        if(association.composition) {
            return;            
        }
        
        var sourceController = models.models[association.aClass].controller;
        var targetController = models.models[association.bClass].controller;

        if (association.isSourceMultiple() && association.isTargetMultiple()) { // [Many to Many]
            buildManyToManyApis(sourceController, association.aClass, association.bClass, association.aRole, association.bRole, association.name);
            buildManyToManyApis(targetController, association.bClass, association.aClass, association.bRole, association.aRole, association.name);
        }
        else if (!association.isSourceMultiple() && !association.isTargetMultiple()) { // [One to One]
            if (association.isSourceOptional()) {
                buildManyCardinalityApis(sourceController, association.aClass, association.bClass, association.aRole, association.bRole, true, association.isTargetOptional());
                buildOneCardinalityApis(targetController, association.bClass, association.aClass, association.bRole, association.aRole);
            }
            else {
                buildOneCardinalityApis(sourceController, association.aClass, association.bClass, association.aRole, association.bRole);
                buildManyCardinalityApis(targetController, association.bClass, association.aClass, association.bRole, association.aRole, true, association.isSourceOptional());
            }
        }
        else { // [One to Many], [Many to One]
            if (association.isSourceMultiple()) {
                buildManyCardinalityApis(sourceController, association.aClass, association.bClass, association.aRole, association.bRole, false, association.isTargetOptional());
            }
            else {
                buildOneCardinalityApis(sourceController, association.aClass, association.bClass, association.aRole, association.bRole);
            }
            if (association.isTargetMultiple()) {
                buildManyCardinalityApis(targetController, association.bClass, association.aClass, association.bRole, association.aRole, false, association.isSourceOptional());
            }
            else {
                buildOneCardinalityApis(targetController, association.bClass, association.aClass, association.bRole, association.aRole);
            }
        }
    });
}

function buildManyToManyApis(controller, sourceName, targetName, sourceRole, targetRole, bridge) {
    
    //Retrieves the linked items
    controller.get('/:id/' + sourceRole, function (req, res, done) {
        getItemsManyToMany(req, res, sourceName, targetName, sourceRole, targetRole, bridge);
    });
    
    //Set the linked items
    controller.put('/:id/' + sourceRole, function (req, res, done) {
        setItemsManyToMany(req, res, sourceName, targetName, sourceRole, targetRole, bridge);
    });
    
    //Link multiple items - Ids included in the body
    controller.post('/:id/' + sourceRole, function (req, res, done) {
        handleMultipleItems(req, res, sourceName, targetName, sourceRole, targetRole, bridge, false, function (sourceName, targetName, sourceId, targetId, bridge, entity, role, oppositeId, entityName, cb) {
            linkItems(bridge, sourceName, targetName, sourceId, targetId, cb);
        });
    });
 
    //Unlink an item - Id included in the url
    controller.delete('/:id/' + sourceRole + '/:' + targetName + 'Id', function (req, res, done) {
        handleSingleItemManyToMany(req, res, sourceName, targetName, sourceRole, targetRole, bridge, unlinkItems);
    });
}

function buildOneCardinalityApis(controller, sourceName, targetName, sourceRole, targetRole) {
    
    //Retrieves the linked item
    controller.get('/:id/' + sourceRole, function (req, res, done) {
        getItem(req, res, sourceName, targetName, sourceRole);
    });
    
    //Link an item - Id included in the url
    controller.post('/:id/' + sourceRole, function (req, res, done) {
        req.params[targetName + 'Id'] = req.body.id;
        handleSingleItem(req, res, sourceName, targetName, sourceRole, targetRole, false, linkTargetToSource);
    });
    
    //Unlink an item - Id included in the url
    controller.delete('/:id/' + sourceRole + '/:' + targetName + 'Id', function (req, res, done) {
        handleSingleItem(req, res, sourceName, targetName, sourceRole, targetRole, false, unlinkTargetFromSource);
    });
}

function buildManyCardinalityApis(controller, sourceName, targetName, sourceRole, targetRole, singleResult, optional) {
    
    //Retrieves the linked items
    controller.get('/:id/' + sourceRole, function (req, res, done) {
        getItems(req, res, sourceName, targetName, sourceRole, targetRole, singleResult);
    });

    if (optional && !singleResult) {
        //Set the linked items - Ids included in the body
        controller.put('/:id/' + sourceRole, function (req, res, done) {
            unlinkAllTargetsFromSource(req, sourceName, targetName, sourceRole, targetRole, function () {
                handleMultipleItems(req, res, sourceName, targetName, sourceRole, targetRole, null, false, function (sourceName, targetName, sourceId, targetId, bridge, entity, role, oppositeId, entityName, cb) {
                    linkTargetToSource(entity, role, oppositeId, entityName, cb);
                });
            });
        });    
    }
    
    //Link multiple items - Ids included in the body
    controller.post('/:id/' + sourceRole, function (req, res, done) {
        handleMultipleItems(req, res, sourceName, targetName, sourceRole, targetRole, null, singleResult, function (sourceName, targetName, sourceId, targetId, bridge, entity, role, oppositeId, entityName, cb) {
            linkTargetToSource(entity, role, oppositeId, entityName, cb);
        });
    });
    
    if (optional) {
        //Unlink an item - Id included in the url
        controller.delete('/:id/' + sourceRole + '/:' + targetName + 'Id', function (req, res, done) {
            handleSingleItem(req, res, sourceName, targetName, sourceRole, targetRole, true, unlinkTargetFromSource);
        });
    }
}

module.exports = {
    apply: apply
};

//Helper functions

function getItem(req, res, sourceName, targetName, role) {
    var sourceId = req.params.id;
    single(sourceName, sourceId, function (err, source) {
        if (err) {
            return utilities.error(res, err);
        }
        if (source[role]) {
            single(targetName, source[role], function (err, target) {
                if (err) {
                    return utilities.error(res, err);
                }
                return utilities.send(res, target);
            });
        }
        else {
            return utilities.send(res, null);
        }
    });
}

function getItems(req, res, sourceName, targetName, sourceRole, targetRole, singleResult) {
    var sourceId = req.params.id;
    single(sourceName, sourceId, function (err, source) {
        if (err) {
            return utilities.error(res, err);
        }
        var query = entityModels[targetName].model.find();
        query.where(targetRole).equals(sourceId);
        query.exec(function (err, items) {
            if (err) {
                return utilities.error(res, err);
            }
            if(singleResult) {
                if(items.length > 0) {
                    return utilities.send(res, items[0]);    
                }
                else {
                    return utilities.send(res, null);
                }
            }
            else {
                return utilities.send(res, items);
            }
        });
    });
}

function getItemsManyToMany(req, res, sourceName, targetName, sourceRole, targetRole, bridge) {
    var sourceId = req.params.id;
    single(sourceName, sourceId, function (err, source) {
        if (err) {
            return utilities.error(res, err);
        }
        var query = entityModels[bridge].model.find();
        query.where(sourceName).equals(sourceId);
        query.populate(targetName);
        query.exec(function (err, records) {
            if (err) {
                return utilities.error(res, err);
            }
            var results = [];
            records.forEach(function (record) {
                results.push(record[targetName]);
            });
            return utilities.send(res, results);
        });
    });
}

function setItemsManyToMany(req, res, sourceName, targetName, sourceRole, targetRole, bridge) {
    var sourceId = req.params.id;
    var targetIds = req.body;
    var targetIndex = targetIds.length;

    if (!targetIndex) {
        targetIds = [];
        targetIndex = 0;
    }

    single(sourceName, sourceId, function (err, source) {
        if (err) {
            return utilities.error(res, err);
        }
        unlinkAllItems(bridge, sourceName, sourceId, function (err) {
            if (err) {
                return utilities.error(res, err);
            }
            if (targetIndex === 0) {
                return utilities.send(res, source);
            }
            targetIds.forEach(function (targetId) {
                single(targetName, targetId, function (err, target) {
                    if (err) {
                        return utilities.error(res, err);
                    }
                    linkItems(bridge, sourceName, targetName, sourceId, targetId, function (err, record) {
                        if (err) {
                            return utilities.error(res, err);
                        }
                        --targetIndex;
                        if (targetIndex === 0) {
                            return utilities.send(res, source);
                        }
                    });
                });
            });
        });
    });
}

function handleMultipleItems(req, res, sourceName, targetName, sourceRole, targetRole, bridge, singleResult, cb) {
    var sourceId = req.params.id;
    var targetIds = req.body;
    if(singleResult) {
        targetIds = [req.body.id];
    }
    var targetIndex = targetIds.length;

    if (!targetIndex) {
        return utilities.error(res, 'invalid "' + targetName + 'Ids".');
    }
    single(sourceName, sourceId, function (err, source) {
        if (err) {
            return utilities.error(res, err);
        }
        targetIds.forEach(function (targetId) {
            single(targetName, targetId, function (err, target) {
                if (err) {
                    return utilities.error(res, err);
                }
                cb(sourceName, targetName, sourceId, targetId, bridge, target, targetRole, sourceId, targetName, function (err, linkedTarget) {
                    if (err) {
                        return utilities.error(res, err);
                    }
                    --targetIndex;
                    if (targetIndex === 0) {
                        return utilities.send(res, source);
                    }
                });
            });
        });
    });
}

function handleSingleItem(req, res, sourceName, targetName, sourceRole, targetRole, inverse, cb) {
    var sourceId = req.params.id;
    var targetId = req.params[targetName + 'Id'];
    retrieveEntities(sourceName, targetName, sourceId, targetId, function (err, source, target) {
        if (err) {
            return utilities.error(res, err);
        }

        var entity = source;
        var role = sourceRole;
        var id = targetId;
        var entityName = sourceName;

        if (inverse) {
            entity = target;
            role = targetRole;
            id = sourceId;
            entityName = targetName;
        }

        cb(entity, role, id, entityName, function (err, linkedItem) {
            if (err) {
                return utilities.error(res, err);
            }
            return utilities.send(res, source);
        });
    });
}

function handleSingleItemManyToMany(req, res, sourceName, targetName, sourceRole, targetRole, bridge, cb) {
    var sourceId = req.params.id;
    var targetId = req.params[targetName + 'Id'];
    retrieveEntities(sourceName, targetName, sourceId, targetId, function (err, source, target) {
        if (err) {
            return utilities.error(res, err);
        }
        cb(bridge, sourceName, targetName, sourceId, targetId, function (err, record) {
            if (err) {
                return utilities.error(res, err);
            }
            return utilities.send(res, source);
        });
    });
}

function retrieveEntities(sourceName, targetName, sourceId, targetId, cb) {
    single(sourceName, sourceId, function (err, source) {
        if (err) {
            return cb(err);
        }
        single(targetName, targetId, function (err, target) {
            if (err) {
                return cb(err);
            }
            return cb(null, source, target);
        });
    });
}

function single(entityName, id, cb) {
    find(entityName, id, function (err, obj) {
        if (err) {
            return cb(err, null);
        }
        if (!obj) {
            return cb(utilities.notFoundException(entityName, id), null);
        }
        return cb(null, obj);
    });
}
function find(entityName, id, cb) {
    entityModels[entityName].model.findOne({ '_id': id }).exec(function (err, category) {
        if (err) {
            return cb(err, null);
        }
        return cb(null, category);
    });
}
function unlinkAllItems(bridge, entityName, id, cb) {
    var query = entityModels[bridge].model.findOne();
    query.where(entityName).equals(id);
    query.remove(function (err) {
        if (err) {
            return cb(err);
        }
        return cb(null);
    });
}
function linkItems(bridge, sourceName, targetName, sourceId, targetId, cb) {
    var query = entityModels[bridge].model.findOne();
    query.where(sourceName).equals(sourceId);
    query.where(targetName).equals(targetId);
    query.exec(function (err, record) {
        if (err) {
            return cb(err);
        }
        if (!record) {
            var entity = {};
            entity[sourceName] = sourceId;
            entity[targetName] = targetId;
            entityModels[bridge].model.create(entity, function (err, record) {
                if (err) {
                    return cb(err, null);
                }
                return cb(null, record);
            });
        }
        else {
            return cb(null, record);
        }
    });
}
function unlinkItems(bridge, sourceName, targetName, sourceId, targetId, cb) {
    var query = entityModels[bridge].model.findOne();
    query.where(sourceName).equals(sourceId);
    query.where(targetName).equals(targetId);
    query.remove(function (err) {
        if (err) {
            return cb(err);
        }
        return cb(null);
    });
}

function linkTargetToSource(source, role, targetId, sourceName, cb) {
    source[role] = targetId;
    source.save(function (err, data) {
        if (err) {
            return cb(err, null);
        }
        return cb(null, data);
    });
}

function unlinkTargetFromSource(source, role, targetId, sourceName, cb) {
    if (String(source[role]) === String(targetId)) {
        source[role] = null;
        source.save(function (err, data) {
            if (err) {
                return cb(err, null);
            }
            return cb(null, data);
        });
    }
    else {
        return cb(utilities.notFoundException(sourceName + '.' + role, targetId), null);
    }
}

function unlinkAllTargetsFromSource(req, sourceName, targetName, sourceRole, targetRole, cb) {
    var sourceId = req.params.id;
    var query = entityModels[targetName].model.find();
    query.where(targetRole).equals(sourceId);
    query.exec(function (err, items) {
        if (err) {
            return cb(err);
        }
        var itemIndex = items.length;
        if (itemIndex === 0) {
            return cb();
        }
        items.forEach(function (item) {
            item[targetRole] = null;
            item.save(function (err, data) {
                if (err) {
                    return cb(err, null);
                }
                --itemIndex;
                if (itemIndex === 0) {
                    return cb();
                }
            });
        });
    });
}