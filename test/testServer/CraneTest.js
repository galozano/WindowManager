/**
 * Created by gal on 12/28/14.
 */

var server =  require('../../app.js');
var scenarioCreator = require("./../scenarioCreator.js");
var expect = require('chai').expect;
var request = require('request');
var configCSM = require('../../src/server/conf/config.json');
var scenario = require('./../scenario.json');

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
                "cranes":[{
                    "craneId":2,
                    "ecAssignedPercentage":50
                }]
            };

            var options = {
                url:url,
                form:{data:JSON.stringify(editCraneJson)},
                headers:{"authorization":"Bearer " + scenario.users[0].userToken}
            };

            request.post(options,function(err, resp, body) {

                expect(resp.statusCode).to.equals(200);

                expect(JSON.parse(body).eventId).to.eq(1);
                expect(JSON.parse(body).eventCranes).to.have.length(1);
                expect(JSON.parse(body).eventCranes[0].ecAssignedPercentage).to.eq(50);

                done();
            });
        });

        it('Erase all cranes', function(done) {

            var editCraneJson = {
                "eventId": 1,
                "cranes":[]
            };

            var options = {
                url:url,
                form:{data:JSON.stringify(editCraneJson)},
                headers:{"authorization":"Bearer " + scenario.users[0].userToken}
            };

            request.post(options,function(err, resp, body) {

                expect(resp.statusCode).to.equals(200);

                expect(JSON.parse(body).eventId).to.eq(1);
                expect(JSON.parse(body).eventCranes).to.have.length(0);

                done();
            });
        });

        it('Invalid Crane or Event Id', function(done) {

            var editCraneJson = {
                "eventId": 123,
                "cranes":[]
            };

            var options = {
                url:url,
                form:{data:JSON.stringify(editCraneJson)},
                headers:{"authorization":"Bearer " + scenario.users[0].userToken}
            };

            request.post(options,function(err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body)).to.eql(configCSM.errors.EVENT_INVALID_ID);

                done();
            });
        });
    });

    describe("Delete Crane Schema", function () {

        var url = 'http://localhost:3000/cranes/deleteCraneSchema';

        it("Delete Crane Schema", function(done) {

            var deleteCraneSchema = {
                craneConfigSchemaId: 2
            };

            var options = {
                url:url,
                headers:{"authorization":"Bearer " + scenario.users[0].userToken},
                form:{data:JSON.stringify(deleteCraneSchema)}
            };

            request.post(options, function (err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body).status).to.equals("OK");

                expect(JSON.parse(body).data).to.exist;
                done();
            });
        });
    });

    describe("Add Crane Schema", function(){

        var url = 'http://localhost:3000/cranes/createCraneSchema';

        it("Add Crane", function(done){

            var craneSchema = {
                "craneConfigSchemaName": "SPRCCraneConfig1",
                "cranes":[{
                    "craneName": "Crane 1",
                    "craneGrossProductivity": 45.3
                }, {
                    "craneName": "Crane 2",
                    "craneGrossProductivity": 50
                }]
            };

            var options = {
                url:url,
                headers:{"authorization":"Bearer " + scenario.users[0].userToken},
                form:{data:JSON.stringify(craneSchema)}
            };

            request.post(options,function(err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body).data).to.exist;
                expect(JSON.parse(body).status).to.equals("OK");
                expect(JSON.parse(body).data.craneConfigSchemaName).to.equals("SPRCCraneConfig1");
                expect(JSON.parse(body).data.cranes).to.have.length(2);
                expect(JSON.parse(body).data.cranes[0].craneGrossProductivity).to.equals(45.3);

                done();
            });
        });

        it("No Cranes", function(done){

            var craneSchema = {
                "craneConfigSchemaName": "SPRCCraneConfig2",
                "cranes":[ ]
            };

            var options = {
                url:url,
                headers:{"authorization":"Bearer " + scenario.users[0].userToken},
                form:{data:JSON.stringify(craneSchema)}
            };

            request.post(options,function(err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body).data).to.exist;
                expect(JSON.parse(body).status).to.equals("ERROR");

                done();
            });

        });
    });

    describe("Get Cranes Schema Config", function() {

        var url = 'http://localhost:3000/cranes/getCranesSchemas';

        it("Get Cranes", function(done){

            var options = {
                url:url,
                headers:{"authorization":"Bearer " + scenario.users[0].userToken}
            };

            request.get(options,function(err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body).data).to.exist;
                expect(JSON.parse(body).data).to.have.length(2);
                expect(JSON.parse(body).data[0].craneConfigSchemaId).to.equals(1);
                expect(JSON.parse(body).data[0].craneConfigSchemaName).to.equals("SPRC Schema");
                expect(JSON.parse(body).data[0].cranes).to.have.length(2);

                done();
            });
        });
    });

});