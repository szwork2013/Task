var expect = require('expect.js');
var request = require('request');
var baucis = require('baucis');

var fixtures = require('./fixtures');

describe('User relationships', function () {
    before(fixtures.fakeserver.init);
    after(fixtures.fakeserver.deinit);
    beforeEach(fixtures.testData.createUserTestData);
    beforeEach(fixtures.testData.setUserIds);

});
