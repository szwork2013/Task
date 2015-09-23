var expect = require('expect.js');
var request = require('request');
var baucis = require('baucis');

var fixtures = require('./fixtures');

describe('Place relationships', function () {
    before(fixtures.fakeserver.init);
    after(fixtures.fakeserver.deinit);
    beforeEach(fixtures.testData.createPlaceTestData);
    beforeEach(fixtures.testData.setPlaceIds);

});
