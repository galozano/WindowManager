/**
 * Created by gal on 12/8/14.
 */
var server =  require('../../app.js');
var scenarioCreator = require("./../scenarioCreator.js");
var expect = require('chai').expect;
var request = require('request');
var scenario = require('./../scenario.json');

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
                expect(JSON.parse(body).terminalId).to.equals(1);
                expect(JSON.parse(body).totalLength).to.equals(1200);
                expect(JSON.parse(body).berths[0].berthSequence).to.equals(1);
                expect(JSON.parse(body).berths[0].berthDraft).to.equals(30);
                expect(JSON.parse(body).berths[2].berthSequence).to.equals(3);
                expect(JSON.parse(body).cranes).to.have.length(2);
                expect(JSON.parse(body).berths).to.have.length(3);

                done();
            });

        });
    });

    describe("Get Terminal Config Schemas", function() {

        var url = 'http://localhost:3000/terminals/getTerminalConfigSchemas';

        it("Get all of them", function(done) {

            var options = {
                url:url,
                headers:{"authorization":"Bearer " + scenario.users[0].userToken}
            };

            request.get(options, function (err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body).status).to.equals("OK");
                expect(JSON.parse(body).data).to.exist;
                expect(JSON.parse(body).data).to.have.length(3);
                expect(JSON.parse(body).data[0].berths).to.have.length(5);

                done();
            });
        });
    });

    describe("Create Terminal Schema", function () {

        var url = 'http://localhost:3000/terminals/createTerminalSchema';

        it("Create Schema", function(done) {

            var berthSchema = {
                "terminalConfigSchemaName": "SPRCConfig1",
                "berths":[{
                    "berthName": "Berth 1",
                    "berthLength":200,
                    "berthSequence":1,
                    "berthDraft":100,
                    "berthStart":true
                }, {
                    "berthName": "Berth 2",
                    "berthLength":200,
                    "berthSequence":2,
                    "berthDraft":100,
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
                expect(JSON.parse(body).data.berths[0].berthDraft).to.equals(100);

                done();
            });
        });

        it("No berths", function(done){

            var berthSchema = {
                "terminalConfigSchemaName": "SPRCConfig2",
                "berths":[]
            };

            var options = {
                url:url,
                headers:{"authorization":"Bearer " + scenario.users[0].userToken},
                form:{data:JSON.stringify(berthSchema)}
            };

            request.post(options, function (err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body).status).to.equals("ERROR");
                expect(JSON.parse(body).data).to.exist;

                done();
            });
        });
    });

    describe("Create Terminal", function() {

        var url = 'http://localhost:3000/terminals/createTerminal';

        it("Create Terminal", function(done) {

            var terminal = {
                "terminalName":"NewTerminal",
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

                //TODO:Verificar que los Terminal Access fueron agregados

                done();
            });
        });
    });

    describe("Delete Terminal Schema", function () {

        var url = 'http://localhost:3000/terminals/deleteTerminalSchema';

        it("Delete Terminal Schema", function(done){

            var deleteTerminal = {
                terminalConfigSchemaId: 3
            };

            var options = {
                url:url,
                headers:{"authorization":"Bearer " + scenario.users[0].userToken},
                form:{data:JSON.stringify(deleteTerminal)}
            };

            request.post(options, function (err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body).status).to.equals("OK");
                expect(JSON.parse(body).data).to.exist;

                done();
            });
        });
    });

    describe("Delete Terminal", function () {

        var url = 'http://localhost:3000/terminals/deleteTerminal';

        it("Delete Terminal", function(done){

            var deleteTerminal = {
                terminalId: 2
            };

            var options = {
                url:url,
                headers:{"authorization":"Bearer " + scenario.users[0].userToken},
                form:{data:JSON.stringify(deleteTerminal)}
            };

            request.post(options, function (err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body).status).to.equals("OK");
                expect(JSON.parse(body).data).to.exist;

                done();
            });
        });
    });

});