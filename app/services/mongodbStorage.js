var mongoose = require('mongoose');
var grid = require('gridfs-stream');
var fs = require('fs');

var cnx, gfs;

function apply(mongooseCnx) {
	cnx = mongooseCnx.connections[0];
	gfs = grid(cnx.db, mongoose.mongo);

	var binaryContentSchema = new mongoose.Schema({ 
		fileName: 	   { type: String, required: false },
	  	content:  	   { type: Buffer, required: false },   //Buffer
	  	mimeType: 	   { type: String, required: false },
	  	size:    	   { type: Number, required: false },
	  	lastModified:  { type: Date,   required: true, default: Date.now },
		description:   { type: String, required: false },
	})
	.index({ fileName: 1 }, { unique: true });

	var binaryContentModel = mongoose.model('binaryContent', binaryContentSchema);
	return binaryContentModel;
}

//See: https://github.com/aheckmann/gridfs-stream

function uploadFile(sourceFilePath, remoteFileName, mimeType, cb) {
	var options = {
    	filename: remoteFileName,
    	mode: 'w', 
    	chunkSize: 1024,
    	content_type: mimeType || 'application/octet-stream', // For content_type to work properly, set "mode"-option to "w" too!
	    metadata: {
	    	lastModified: Date.now()
   		}
	};
	var writestream = gfs.createWriteStream(remoteFileName, options);
	var r = fs.createReadStream(sourceFilePath).pipe(writestream);
	r.on('error', function (err) {
		cb(err, null);
	});
	r.on('close', function (file) {
		cb(null, file);
	});
}

function downloadFile(remoteFileName, localFileName, cb) {
	try {
		var options = {
			filename: remoteFileName
		};
		var readstream = gfs.createReadStream(options);
		var writeStream = fs.createWriteStream(localFileName);
		writeStream.on('error', function (err) {
			cb(err, null);
		});
		readstream.on('error', function (err) {
			cb(err, null);
		});
		readstream.on('close', function (file) {
			cb(null, localFileName);
		});
		readstream.pipe(writeStream);
	}
	catch(err) {
		cb(err, null);		
	}
}

function deleteFile(remoteFileName, cb) {
	var options = {
		filename: remoteFileName
	};
	gfs.remove(options, function (err) {
		if (err) {
			return cb(err, null); //error			
		}
		return cb(null, options); //done
	});
}
function getFileResourceName(targetName) {
	return '/api/binary/' + targetName;
}

module.exports = {
	apply: apply,
	uploadFile: uploadFile,
	downloadFile: downloadFile,
	deleteFile: deleteFile,
	getFileResourceName: getFileResourceName
};
