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
    });

    describe("Create Terminal", function() {

        var url = 'http://localhost:3000/terminals/createTerminal';

        it("Create Terminal", function(done) {

            var terminal = {
                terminalName:"NewTerminal",
                "terminalConfigSchemaId": 1,
                "craneConfigSchemaId": 1
            };

            var options = {
                url:url,
                headers:{"authorization":"Bearer " + scenario.users[0].userToken},
                form:{data:JSON.stringify(terminal)}
            };


            request.post(options, function (err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body).status).to.equals("OK");
                expect(JSON.parse(body).data).to.exist;
                expect(JSON.parse(body).data.terminalName).to.equals("NewTerminal");

                done();
            });
        });
    });

    describe.only("Create Terminal Schema", function () {

        var url = 'http://localhost:3000/terminals/createTerminalSchema';

        it("Create Schema", function(done) {

            var berthSchema = {
                "terminalConfigSchemaName": "SPRCConfig1",
                "berths":[{
                        "berthName": "Berth 1",
                        "berthLength":200,
                        "berthSequence":1,
                        "berthStart":true
                    }, {
                        "berthName": "Berth 2",
                        "berthLength":200,
                        "berthSequence":2,
                        "berthStart":false
                    }]
            };

            var options = {
                url:url,
                headers:{"authorization":"Bearer " + scenario.users[0].userToken},
                form:{data:JSON.stringify(berthSchema)}
            };

            request.post(options, function (err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body).status).to.equals("OK");
                expect(JSON.parse(body).data).to.exist;
                expect(JSON.parse(body).data.terminalConfigSchemaName).to.equals("SPRCConfig1");
                expect(JSON.parse(body).data.berths).to.have.length(2);

                done();
            });
        });
    });
});