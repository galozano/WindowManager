/**
 * Created by gal on 12/8/14.
 */
var server =  require('../app.js');
var scenarioCreator = require("./scenarioCreator.js");
var expect = require('chai').expect;
var request = require('request');
var scenario = require('./scenario.json');

describe('Test Terminals', function() {

    before(function(done){

        console.log("Before");

        scenarioCreator.prepareScenario(function(events) {

            console.log('Creating Scenario');
            eventsCreated = events;
            done();
        });

    });

    describe("Get Terminals", function(){

        var url = 'http://localhost:3000/terminals/getTerminals';

        it('Get all terminals', function(done) {

            var options = {
                url:url,
                headers:{"authorization":"Bearer " + scenario.users[0].userToken}
            };

            request.get(options, function (err, resp, body) {

                expect(JSON.parse(body)).to.have.length(2);

                done();
            });
        });

    });

    describe("Get Information of One terminal", function () {

        var url = 'http://localhost:3000/terminals/getTerminal/1';

        it("Get One terminal", function (done) {

            var options = {
                url:url,
                headers:{"authorization":"Bearer " + scenario.users[0].userToken}
            };

            request.get(options, function (err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body).berths[0].berthSequence).to.equals(1);
                expect(JSON.parse(body).berths[2].berthSequence).to.equals(3);

                expect(JSON.parse(body).cranes).to.have.length(2);
                done();
            });

        });
    })


});