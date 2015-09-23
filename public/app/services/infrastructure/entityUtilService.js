angular.module('myApp').service('EntityUtilService', ['$timeout', function ($timeout) {
	var EntityUtilService = {};

	//Sort functions ----------------
	EntityUtilService.sortBy = function(searchContext, field) {
		searchContext.sort = searchContext.sort || {}; 
		var currentValue = searchContext.sort[field];
		setAllValues(searchContext.sort, null);
		if (currentValue === true) {
			searchContext.sort[field] = false; //DESC
		}
		//else if (currentValue === false) {
		//	searchContext.sort[field] = null; //None
		//}
		else {
			searchContext.sort[field] = true; //ASC			
		}
	};
	function setAllValues(col, value) {
		for(var key in col) {
			col[key] = value;
		}
	}

	//Export functions -------------------------------------------
	function exportAsCsv(service, searchCriteria, label, scope) { 
		scope.dataReceived = false;	

		service.getFileAsCsv(searchCriteria)
		.then(function(httpResponse) {
			sendFile(httpResponse, label + ".csv", "text/csv");
		})
		.finally(function() {
			scope.dataReceived = true;
		});
	}

	function exportAsXml(service, searchCriteria, label, scope) { 
		scope.dataReceived = false;	
		service.getFileAsXml(searchCriteria)
		.then(function(httpResponse) {
			sendFile(httpResponse, label + ".xml", "text/xml");
		})
		.finally(function() {
			scope.dataReceived = true;
		});
	}

	function exportAsXlsx(service, searchCriteria, label, scope) {
		scope.dataReceived = false;	
		service.getFileAsXlsx(searchCriteria)
		.then(function(httpResponse) {
			sendFile(httpResponse, label + ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
		})
		.finally(function() {
			scope.dataReceived = true;
		});
	}

	function sendFile(httpResponse, fileName, mime) {
		var data = httpResponse.data;
		var headers = httpResponse.headers();
		var filename = headers["x-filename"] || fileName || "localidades.csv";
		var contentType = headers["content-type"] || mime || "text/csv";
		var blob;
		var url;

		if (navigator.msSaveBlob)
		{
			// Save blob is supported, so get the blob as it's contentType and call save.
			blob = new Blob([data], { type: contentType });
			navigator.msSaveBlob(blob, filename);
		}
		else
		{
			// Get the blob url creator
			var urlCreator = window.URL || window.webkitURL || window.mozURL || window.msURL;
			if(urlCreator)
			{
				// Try to use a download link
				var link = document.createElement("a");
				if("download" in link)
				{
					// Prepare a blob URL
					blob = new Blob([data], { type: contentType });
					url = urlCreator.createObjectURL(blob);
					link.setAttribute("href", url);

					// Set the download attribute (Supported in Chrome 14+ / Firefox 20+)
					link.setAttribute("download", filename);

					// Simulate clicking the download link
					var event = document.createEvent('MouseEvents');
					event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
					link.dispatchEvent(event);
				} else {
					// Prepare a blob URL
					// Use application/octet-stream when using window.location to force download
					blob = new Blob([data], { type: octetStreamMime });
					url = urlCreator.createObjectURL(blob);
					window.location = url;
				}
			} else {
				console.log("Not supported");
			}
		}
	}
	//Selection helpers ----
	function getAllAreSelected(dataSource) {
		var selectedCount = EntityUtilService.getSelectedItems(dataSource).length;
		return selectedCount == dataSource.length; 
	}

	//Public API-----------------------------------------------

	EntityUtilService.exportAsFormat = function (format, searchCriteria, service, label, scope) { 
		if (format === 'xml') {
			exportAsXml(service, searchCriteria, label, scope);
		} else if (format === 'csv') {
			exportAsCsv(service, searchCriteria, label, scope);
		} else if (format === 'xlsx') {
			exportAsXlsx(service, searchCriteria, label, scope);			
		}
	};

	//Selection functions -------------------------------------------

	EntityUtilService.getSelectedItems = function(dataSource) {
		var res = [];
		for(var index in dataSource) {
			var item = dataSource[index];
			if (item._isSelected) {
				res.push(item);
			}
		}
		return res;
	};
	
	EntityUtilService.selectItem = function (dataSource, selectionContext, item, event) {
		item._isSelected = (event.currentTarget.checked);
		selectionContext.allSelected = getAllAreSelected(dataSource);
		selectionContext.noneSelected = EntityUtilService.getSelectedItems(dataSource).length === 0;
	};

	EntityUtilService.selectAll = function (dataSource, selectionContext, event) {
		var value = (event.currentTarget.checked);
		if (value == null) {
			return; //mixted state
		}
		selectionContext.allSelected = value;
		selectionContext.noneSelected = !value;
		dataSource.forEach(function(item) {
			item._isSelected = value;
		});
	};

	//Delete operations -----
	EntityUtilService.deleteByQuery = function (service, searchCriteria, refreshCallback) {		
		service.deleteByQuery(searchCriteria)
			.finally(function(f) {
				$timeout(function() {
					if (refreshCallback) {
						refreshCallback();
					}			
				}, 500);       
			}); 
	};

	EntityUtilService.deleteSelected = function (service, dataSource, refreshCallback) {		
		var ids = [];
		EntityUtilService.getSelectedItems(dataSource).forEach(function(item) {
			ids.push(item._id);
		});
				
		service.deleteMany(ids)
			//.catch(function(err) {
			//})
			.finally(function(f) {
				$timeout( function() {
					if (refreshCallback) {
						refreshCallback();
					}			
				}, 500); 			
			});
	};

	//Returns a simple clone of the object. Build for simple POJOs case of use with no circular recursion expected.
	EntityUtilService.clone = function(obj) {
		if (!obj) {
			return obj;
		}
		return JSON.parse(JSON.stringify(obj));		
	};
	
	EntityUtilService.buildMultipartMessage = function(payloadParamName, obj) {
		var msg = EntityUtilService.clone(obj);
		var fd = new FormData(); //Requires > IE10
		
		for(var key in msg) {
			if (obj.hasOwnProperty(key)) {
				var item = obj[key];
				if (isFile(item)) {
					fd.append(key, item); //, item.name);
					msg[key] = 'cid:' + key;
				}
			}
		}
		//payload
		var blob = new Blob([angular.toJson(msg)], {"type" : "application/json"});
		
		fd.append(payloadParamName, blob);
		return fd;
	};
	
	function isFile(item) {
		if (!item) {
			return false;
		}
		if (item.constructor && item.constructor.name === 'File') {
			return true;
		}
		//duck typing for Safari. Cuack, cuack!
		if (item.type && item.name && item.size && (item.lastModifiedDate || item.lastModified)) {
			return true;
		}
		return false;
	}

	return EntityUtilService;
}]);