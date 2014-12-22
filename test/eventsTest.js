/**
 * Created by gal on 11/26/14.
 */

    //TODO:Organizar las pruebas bien y terminarlas

var server =  require('../app.js');
var scenarioCreator = require("./scenarioCreator.js");
var expect = require('chai').expect;
var request = require('request');

describe('Test Events', function() {

    var eventsCreated = [];

    before(function(done){

        console.log("Before");

        scenarioCreator.prepareScenario(function(events) {

            console.log('Creating Scenario');
            eventsCreated = events;
            done();
        });

        //done();

    });


    describe('Get Events', function() {

        // The URL we are testing
        var url = 'http://localhost:3000/events/getEvents';

        it('Get events by specific terminal', function(done) {

            var finalURL = url + "/1";

            console.log(finalURL);

            request.get(finalURL, function (err, resp, body) {

                console.log(JSON.parse(body));

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body)).to.have.length(2);

                expect(JSON.parse(body)[0].berthId).to.equals(6);
                expect(JSON.parse(body)[0].day).to.equals(3);


                done();
            });
        });

        it('Get Error Invalid Id', function(done) {

            request.get(url+"/ABC", function (err, resp, body) {


                expect(JSON.parse(body).code).to.eql("TERMINAL_INVALID_ID");

                done();
            });
        });
    });


    describe('Add Events', function() {

        var eventJSON = {
            eventName:"Nuevo Evento",
            arrivingTime:"11:00",
            duration:50,
            eventStart:300,
            eventLength:400,
            day:3,
            terminalId:1,
            berthId:4
        };

        var url = 'http://localhost:3000/events/addEvent';

        it('Add One Event', function(done){

            request.post({url:url, form:eventJSON},function(err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body).eventName).to.eq("Nuevo Evento");
                expect(JSON.parse(body).terminalId).to.eq(1);
                done();
            });
        });
    });


    describe('Edit Events', function() {

        var url = 'http://localhost:3000/events/editEvent';

        it('Edit Event 1', function(done) {

            console.log(eventsCreated);
            var editEventId = eventsCreated[1].eventId;

            var eventJSON =
            {
                "eventName":"Nuevo Evento Editado",
                "arrivingTime":"11:00",
                "duration":50,
                "eventStart":300,
                "eventLength":400,
                "day":3,
                "eventId":editEventId,
                "berthId":1
            };

            request.post({url:url, form:eventJSON},function(err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                expect(JSON.parse(body).arrivingTime).to.equals("11:00");
                expect(JSON.parse(body).day).to.equals(3);
                expect(JSON.parse(body).berthId).to.equals(1);

                done();
            });
        });

    });

    describe('Delete Event', function (){

        var url = 'http://localhost:3000/events/deleteEvent';

        it('Delete Event 1', function(done) {

            var editEventId = eventsCreated[1].eventId;

            var eventJSON =
            {
                "eventId":editEventId
            };

            request.post({url:url, form:eventJSON},function(err, resp, body) {

                expect(resp.statusCode).to.equals(200);
                console.log(JSON.parse(body));
                done();
            });
        });
    });
});



