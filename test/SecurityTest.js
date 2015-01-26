/**
 * Created by gal on 1/25/15.
 */
var server =  require('../app.js');
var scenarioCreator = require("./scenarioCreator.js");
var expect = require('chai').expect;
var request = require('request');
var scenario = require('./scenario.json');

describe('Test Security', function() {

    before(function (done) {

        console.log("Before");

        scenarioCreator.prepareScenario(function (events) {

            console.log('Creating Scenario');
            done();
        });
    });

    describe("Add Terminal Access", function() {

        var url = 'http://localhost:3000/security/addTerminalAccess';

        it("Add Terminal", function(done){

            var addTerminalAccess = {
                terminalId: 1,
                rolId:2
            };

            var options = {
                url:url,
                headers:{"authorization":"Bearer " + scenario.users[0].userToken},
                form:{data:JSON.stringify(addTerminalAccess)}
            };

            request.post(options, function (err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body).status).to.equals("OK");
                expect(JSON.parse(body).data).to.exist;

                done();
            });

        });

        it("Add Terminal Duplicate", function(done){

            var addTerminalAccess = {
                terminalId: 1,
                rolId:1
            };

            var options = {
                url:url,
                headers:{"authorization":"Bearer " + scenario.users[0].userToken},
                form:{data:JSON.stringify(addTerminalAccess)}
            };

            request.post(options, function (err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body).status).to.equals("ERROR");

                done();
            });

        });

    });

});