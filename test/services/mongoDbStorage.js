var expect = require('expect.js');
var mongoose = require('mongoose');
var cnx; 
var sut = require('../../app/services/mongodbStorage.js');
var fs = require('fs');

function init(done) {
	cnx = mongoose.connect('mongodb://localhost:27017/imageTestDb', {}, function(db) {
		sut.apply(cnx);
		done();
	});
}

describe('mongodb binary storage', function() {
	this.timeout(5000);
	before(init);

	it('store & delete', function(done) {
		sut.uploadFile('manifest.yml', 'a.yml', 'text/yaml', function(err, data) {
			if (err) {
				return done(err);	
			}
			expect(err).to.be(null);
			expect(data._id).not.to.be(null);
			expect(data.contentType).to.be('binary/octet-stream');
			expect(data.length > 0).to.be(true);
			expect(data).to.have.property('md5');
			expect(data.filename).to.be('a.yml');
			
			sut.deleteFile('a.yml', function (err, data) {
				if (err) {
					return done(err);						
				}

				return done();
			});
		});
	});
	
	it('find', function(done) {
		sut.uploadFile('manifest.yml', 'a.yml', 'text/yaml', function(err, data) {
			if (err) {
				return done(err);	
			}
			expect(err).to.be(null);
			expect(data._id).not.to.be(null);
			expect(data.filename).to.be('a.yml');
			
			sut.downloadFile('a.yml', 'ab.yml', function (err, filename1) {
				if (err) {
					return done(err);						
				}
				expect(filename1).to.be('ab.yml');
				
				fs.unlinkSync('ab.yml'); //delete file
				
				sut.deleteFile('a.yml', function (err, data) {
					if (err) {
						return done(err);						
					}
					return done();
				});
			});
			
		});		
	});
	
});