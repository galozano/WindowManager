
var scenarioCreator = require("../scenarioCreator.js");

describe('Colibri Login Homepage', function() {

    beforeEach(function() {

        var done = false;

        runs(function(){
            scenarioCreator.prepareScenario(function(events) {

                console.log('Creating Scenario');
                browser.get('http://localhost:3000/');
                done = true;
            })
        });

        waitsFor(function(){
            return done;
        });

    });

    it('Failed Login', function() {

        element(by.model('loginUser.email')).sendKeys("gustavo@kelgal.com");
        element(by.model('loginUser.password')).sendKeys("gusti");

        element(by.id('loginBtn')).click();

    });

    it('Good Login', function() {

        element(by.model('loginUser.email')).sendKeys("gustavo@gmail.com");
        element(by.model('loginUser.password')).sendKeys("gusti");

        element(by.id('loginBtn')).click();
        expect(element(by.id('navBarTittle')).getText()).toEqual("Service Manager");

    });

});