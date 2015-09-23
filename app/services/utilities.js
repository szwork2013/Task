function success(res) {
    send(res, { 'success': 'ok' });
}

function error(res, err) {
    if (err.type === 'NotFound') {
        return notFound(res, err.resource, err.id);
    }
    else {
        if (err.code === 11000) {
            //MongoDB duplicate key - invalid operation
            send(res, { 'error': err }, 412);
        }
        else {
            send(res, { 'error': err }, 500);
        }
    }
}

function notFound(res, schema, id) {
    send(res, { 'error': 'Not Found', 'schema': schema, 'id': id }, 404);
}

function send(res, msg, statusCode) {
    statusCode = statusCode || 200;
    res.status(statusCode)
        .json(msg)
        .end();
}

function logError(err) {
    console.error(err);
}

function notFoundException(resourceName, id) {
    return {
        type: 'NotFound',
        resource: resourceName,
        id: id
    };
}

module.exports = {
    success: success,
    error: error,
    notFound: notFound,
    send: send,
    logError: logError,
    notFoundException: notFoundException
};