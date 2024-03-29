var expect = require('expect.js');
var sut = require("../app/conf/configuration");

describe('Configuration', function(){
	
	describe('security', function(){
		it('apikey is defined', function(){
			expect(sut.getConfiguration().security).to.have.property('apiKey');
			expect(sut.getConfiguration().security.apiKey).not.to.be(null);
			expect(sut.getConfiguration().security.apiKey).not.to.be('');
		});
	});
	
	describe('hosting properties', function(){
		it('appPort is defined', function(){
			expect(sut.getConfiguration()).to.have.property('appPort');
			expect(sut.getConfiguration().appPort).not.to.be(null);
			expect(sut.getConfiguration().appPort).not.to.be('');
		});
		it('appHost is defined', function(){
			expect(sut.getConfiguration()).to.have.property('appHost');
			expect(sut.getConfiguration().appHost).not.to.be(null);
			expect(sut.getConfiguration().appHost).not.to.be('');
		});
		it('staticCacheTime is defined', function(){
			expect(sut.getConfiguration()).to.have.property('staticCacheTime');
			expect(sut.getConfiguration().staticCacheTime).not.to.be(null);
			expect(sut.getConfiguration().staticCacheTime).not.to.be('');
		});
		it('mongodbConnection is defined', function(){
			expect(sut.getConfiguration()).to.have.property('mongodbConnection');
			expect(sut.getConfiguration().mongodbConnection).not.to.be(null);
			expect(sut.getConfiguration().mongodbConnection).not.to.be('');
		});
		it('rootHttpDir is defined', function(){
			expect(sut.getConfiguration()).to.have.property('rootHttpDir');
			expect(sut.getConfiguration().rootHttpDir).not.to.be(null);
			expect(sut.getConfiguration().rootHttpDir).not.to.be('');
		});
	});
});