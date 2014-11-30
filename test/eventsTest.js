/**
 * Created by gal on 11/26/14.
 */

var assert = require('assert');
var server =  require('../app.js');
var scenarioCreator = require("./scenarioCreator.js");
var expect = require('chai').expect;
var request = require('request');


describe('Test Events', function() {

    before(function(done){

        console.log("Before");

        //scenarioCreator.clearDatabase();
        //scenarioCreator.insertEvents();

        //setTimeout(done, 1000);

        done();
    });


    describe('Get Events', function() {

        // The URL we are testing
        var url = 'http://localhost:3000/events';
        var options = { json: true };

        it('should work first', function(done) {

            request.get(url, options, function (err, resp, body) {

                expect(body).to.have.length(4);

                done();
            });
        });
    });


    describe('Add Events', function() {

        var eventJSON =
        {
            "eventName":"Nuevo Evento",
            "arrivingTime":"11:00",
            "duration":50,
            "eventStart":300,
            "eventLength":400,
            "day":3
        };

        var url = 'http://localhost:3000/addEvent';

        it('Add 1 Event', function(done){

            request.post({url:url, form:eventJSON},function(err, resp, body) {

                expect(body).to.have.length(5);
                done();
            });
        });
    });


    describe('Edit Events', function() {

        var eventJSON =
        {
            "eventName":"Nuevo Evento Editado",
            "arrivingTime":"11:00",
            "duration":50,
            "eventStart":300,
            "eventLength":400,
            "day":3,
            "eventId":53
        };

        var url = 'http://localhost:3000/editEvent';

        it('Edit Event 1', function(done) {
            request.post({url:url, form:eventJSON},function(err, resp, body) {


                console.log(body);
                done();
            });
        });

    });

    describe('Delete Event', function (){

        var url = 'http://localhost:3000/deleteEvent';

        var eventJSON =
        {
            "eventId":53
        };

        it.only('Delete Event 1', function(done) {

            request.post({url:url, form:eventJSON},function(err, resp, body) {

                console.log(body);
                done();
            });
        });

    });
});



