/**
 * Created by gal on 11/26/14.
 */
var server =  require('../app.js');
var scenarioCreator = require("./scenarioCreator.js");
var expect = require('chai').expect;
var request = require('request');
var configCSM = require('../server/conf/config.json');

describe.only('Test Events', function() {

    before(function(done){

        console.log("Before");

        scenarioCreator.prepareScenario(function(events) {

            console.log('Creating Scenario');
            done();
        });

    });

    describe('Get Events of Terminal 1', function() {

        // The URL we are testing
        var url = 'http://localhost:3000/events/getEvents';

        it('Get events by specific terminal', function(done) {

            //Terminal 1
            var finalURL = url + "/1";

            console.log("URL:" + finalURL);

            request.get(finalURL, function (err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body)).to.have.length(2);

                expect(JSON.parse(body)[0].berthId).to.equals(6);
                expect(JSON.parse(body)[0].eventDay).to.equals(3);

                expect(JSON.parse(body)[0].eventCranes).to.have.length(2);

                done();
            });
        });

        it('Get Error Invalid Id', function(done) {

            request.get(url+"/ABC", function (err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body)).to.eql(configCSM.errors.TERMINAL_INVALID_ID);

                done();
            });
        });
    });


    describe('Add Events', function() {

        var eventJSON = {
            eventName:"Nuevo Evento",
            eventArrivingTime:"11:00",
            eventDuration:50,
            eventStart:300,
            eventLength:400,
            eventDay:3,
            terminalId:1,
            berthId:4
        };

        var url = 'http://localhost:3000/events/addEvent';

        it('Add One Event', function(done){

            request.post({url:url, form:eventJSON},function(err, resp, body) {

                expect(resp.statusCode).to.equals(200);

                expect(JSON.parse(body).eventName).to.eq("Nuevo Evento");
                expect(JSON.parse(body).eventArrivingTime).to.eq("11:00");
                expect(JSON.parse(body).eventDuration).to.eq(50);
                expect(JSON.parse(body).eventStart).to.eq(300);
                expect(JSON.parse(body).eventLength).to.eq(400);
                expect(JSON.parse(body).eventDay).to.eq(3);
                expect(JSON.parse(body).terminalId).to.eq(1);
                expect(JSON.parse(body).berthId).to.eq(4);
                expect(JSON.parse(body).eventCranes).to.have.length(0);

                done();
            });
        });
    });


    describe('Edit Events', function() {

        var url = 'http://localhost:3000/events/editEvent';

        it('Edit Event 1', function(done) {


            var eventJSON =
            {
                "eventName":"Nuevo Evento Editado",
                "eventArrivingTime":"11:00",
                "eventDuration":50,
                "eventStart":300,
                "eventLength":100,
                "eventDay":3,
                "eventId":2,
                "berthId":1
            };

            request.post({url:url, form:eventJSON},function(err, resp, body) {

                expect(resp.statusCode).to.equals(200);

                expect(JSON.parse(body).eventName).to.eq("Nuevo Evento Editado");
                expect(JSON.parse(body).eventArrivingTime).to.eq("11:00");
                expect(JSON.parse(body).eventDuration).to.eq(50);
                expect(JSON.parse(body).eventStart).to.eq(300);
                expect(JSON.parse(body).eventLength).to.eq(100);
                expect(JSON.parse(body).eventDay).to.eq(3);
                expect(JSON.parse(body).terminalId).to.eq(1);
                expect(JSON.parse(body).berthId).to.eq(1);
                expect(JSON.parse(body).eventCranes).to.have.length(0);

                done();
            });
        });

    });

    describe('Delete Event', function (){

        var url = 'http://localhost:3000/events/deleteEvent';

        it('Delete Event 1', function(done) {

            var editEventId = 1;

            var eventJSON = {
                "eventId":editEventId
            };

            request.post({url:url, form:eventJSON},function(err, resp, body) {

                expect(resp.statusCode).to.equals(200);

                console.log(JSON.parse(body)).to.eq("OK");
                done();
            });
        });
    });
});