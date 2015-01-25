/**
 * Created by gal on 1/3/15.
 */

var server =  require('../app.js');
var scenarioCreator = require("./scenarioCreator.js");
var expect = require('chai').expect;
var request = require('request');
var configCSM = require('../server/conf/config.json');

describe('Test Users', function() {

    before(function(done){

        console.log("Before");

        scenarioCreator.prepareScenario(function(events) {

            console.log('Creating Scenario');
            done();
        });
    });

    describe('Create User', function() {

        var url = 'http://localhost:3000' + configCSM.urls.users.main + configCSM.urls.users.createUser;

        it('Create User Normal Case', function(done) {

            var newUser = {
                "userFirstName":"Natalia",
                "userLastName":"Perez",
                "userEmail":"nperez@gmail.com",
                "userPassword":"nat123"
            };

            request.post({url:url, form:newUser}, function (err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body).userFirstName).to.eq(newUser.userFirstName);
                expect(JSON.parse(body).userLastName).to.eq(newUser.userLastName);
                expect(JSON.parse(body).userEmail).to.eq(newUser.userEmail);

                done();
            });
        });
    });

    describe('Login User', function() {

        var url = 'http://localhost:3000' + configCSM.urls.users.main + configCSM.urls.users.login;

        it('Login Ok', function(done) {

            var loginUser = {
                "userEmail":"gustavo@gmail.com",
                "userPassword":"gusti"
            };

            request.post({url:url, form:loginUser}, function (err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body).userFirstName).to.eq("Gustavo");
                expect(JSON.parse(body).userLastName).to.eq("Lozano");
                expect(JSON.parse(body).userEmail).to.eq("gustavo@gmail.com");

                done();
            });
        });

        it('Wrong Login', function(done) {

            var loginUser = {
                "userEmail":"gustavo@gmail.com",
                "userPassword":"XXXXXX"
            };

            request.post({url:url, form:loginUser}, function (err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body).code).to.eq(configCSM.errors.INVALID_USER.code);

                done();
            });
        });
    });

    describe('Change User Password', function() {

        var url = 'http://localhost:3000' + configCSM.urls.users.main + configCSM.urls.users.changePassword;

        it('Change User Password', function(done) {

            var loginUser = {
                "userEmail":"gustavo@gmail.com",
                "oldPassword":"gusti",
                "newPassword":"gusti123"
            };

            request.post({url:url, form:loginUser}, function (err, resp, body) {

                expect(resp.statusCode).to.equals(200);

                expect(JSON.parse(body).userFirstName).to.eq("Gustavo");
                expect(JSON.parse(body).userLastName).to.eq("Lozano");
                expect(JSON.parse(body).userEmail).to.eq("gustavo@gmail.com");

                done();
            });
        });

        it('Wrong old Password', function(done) {

            var loginUser = {
                "userEmail":"gustavo@gmail.com",
                "oldPassword":"XXXXX",
                "newPassword":"gusti1234"
            };

            request.post({url:url, form:loginUser}, function (err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body).code).to.eq(configCSM.errors.INVALID_USER.code);

                done();
            });

        });
    });
});