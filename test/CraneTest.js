/**
 * Created by gal on 12/28/14.
 */

var server =  require('../app.js');
var scenarioCreator = require("./scenarioCreator.js");
var expect = require('chai').expect;
var request = require('request');
var configCSM = require('../server/conf/config.json');
var scenario = require('./scenario.json');

describe('Test Cranes', function() {

    before(function(done){

        console.log("Before");

        scenarioCreator.prepareScenario(function(events) {

            console.log('Creating Scenario');
            done();
        });

    });

    describe('Edit Cranes', function() {

        var url = 'http://localhost:3000/cranes/editEventCranes';

        it('Edit Event Cranes', function(done) {

            var editCraneJson = {
                "eventId": 1,
                "cranes":[{craneId:2}]
            };

            var editCraneString = JSON.stringify(editCraneJson);
            console.log(JSON.stringify(scenario.users[0]));

            var options = {
                url:url,
                form:{json:editCraneString},
                headers:{"authorization":"Bearer " + scenario.users[0].userToken}
            };

            request.post(options,function(err, resp, body) {

                expect(resp.statusCode).to.equals(200);

                expect(JSON.parse(body).eventId).to.eq(1);
                expect(JSON.parse(body).eventCranes).to.have.length(1);

                done();
            });
        });

        it('Erase all cranes', function(done) {

            var editCraneJson = {
                "eventId": 1,
                "cranes":[]
            };

            var editCraneString = JSON.stringify(editCraneJson);
            console.log(editCraneString);

            var options = {
                url:url,
                form:{json:editCraneString},
                headers:{"authorization":"Bearer " + scenario.users[0].userToken}
            };

            request.post(options,function(err, resp, body) {

                expect(resp.statusCode).to.equals(200);

                expect(JSON.parse(body).eventId).to.eq(1);
                expect(JSON.parse(body).eventCranes).to.have.length(0);

                done();
            });
        });

        it('Invalid Crane or Event Id', function() {

            var editCraneJson = {
                "eventId": 'ABC',
                "cranes":[]
            };

            var editCraneString = JSON.stringify(editCraneJson);
            console.log(editCraneString);

            var sentJson = {json:editCraneString};

            request.post({url:url, form:editCraneJson},function(err, resp, body) {

                //expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body).code).to.eql(configCSM.errors.EVENT_INVALID_ID);

                done();
            });
        });
    });
});