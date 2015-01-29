/**
 * Created by gal on 1/28/15.
 */
var scenarioCreator = require("../scenarioCreator.js");

describe('Colibri Events Homepage', function() {

    beforeEach(function() {

        var done = false;

        runs(function(){
            scenarioCreator.prepareScenario(function(events) {

                console.log('Creating Scenario');
                browser.get('http://localhost:3000/#/');
                done = true;
            })
        });

        waitsFor(function(){
            return done;
        });
    });

    function login() {
        element(by.model('loginUser.email')).sendKeys("gustavo@gmail.com");
        element(by.model('loginUser.password')).sendKeys("gusti");
        element(by.id('loginBtn')).click();
    }

    it('Add Event', function() {

        login();
        browser.get(' http://localhost:3000/#/events/1');

        var createBtn = element(by.id('createEvent'));
        var addEvent = element(by.id('addEventsBtn'));

        var eventName = element(by.model('newEvent.eventName'));
        var eventDay = element.all(by.repeater('day in days'));
        var arrivingTime = element(by.model('newEvent.eventArrivingTime'));
        var eventDuration = element(by.model('newEvent.eventDuration'));
        var berthId =  element.all(by.repeater('berth in terminal.mainBerths'));
        var eventStart = element(by.model('newEvent.eventStart'));
        var eventLength = element(by.model('newEvent.eventLength'));

        var events = element.all(by.repeater('event in events'));
        expect(events.count()).toEqual(2);

        createBtn.click();
        eventName.sendKeys("New Protractor Event");
        eventDay.get(0).click();
        arrivingTime.sendKeys("10:00");
        eventDuration.sendKeys("50");
        berthId.get(0).click();
        eventStart.sendKeys("300");
        eventLength.sendKeys("300");

        addEvent.click();

        expect(events.count()).toEqual(3);
    });

    it("Delete Event", function() {

        browser.get(' http://localhost:3000/#/events/1');
        var events = element.all(by.repeater('event in events'));
        var remover = events.get(0).element(by.className("remover"));

        expect(events.count()).toEqual(2);
        remover.click();
        expect(events.count()).toEqual(1);
    });

    it("Edit Crane", function () {

       // login();
        browser.get(' http://localhost:3000/#/events/1');
        var events = element.all(by.repeater('event in events'));
        var editCrane = events.get(0).element(by.className("craneSelection"));

        editCrane.click();

        var cranes =  element.all(by.repeater('crane in cranesList'));
        var selectCrane = cranes.get(0).element(by.model("crane.value"));

        selectCrane.click();

        //var assignedCranes = events.get(0).element.all(by.repeater('crane in event.eventCranes'));
        //expect(assignedCranes.count()).toEqual(1);
    });
});


