/**
 * Created by gal on 1/27/15.
 */

var scenarioCreator = require("../scenarioCreator.js");

describe('Colibri Terminal Homepage', function() {

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

    it('# of Terminals', function() {

        login();
        var terminals = element.all(by.repeater('terminal in terminals'));

        expect(element(by.id('navBarTittle')).getText()).toEqual("Service Manager");
        expect(terminals.count()).toEqual(2);
    });

    it('Get to First Service', function() {

        //login();
        var terminals = element.all(by.repeater('terminal in terminals'));
        terminals.get(0).click();
        expect(element(by.binding('terminal.terminalName')).getText()).toEqual("SPRC");
    });
});