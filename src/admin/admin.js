/**
 * Created by gal on 1/19/15.
 */

var request = require('request');
var configCSM = require('../server/conf/config.json');

//var userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJGaXN0TmFtZSI6Ikd1c3Rhdm8iLCJ1c2VyTGFzdE5hbWUiOiJMb3phbm8iLCJ1c2VyRW1haWwiOiJndXN0YXZvQGdtYWlsLmNvbSJ9.XifH3qwM6y7MCdMbAxr0kIlendSuo1OVH29kU2vAEpM';
var userToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyRmlyc3ROYW1lIjoiR3VzdGF2byIsInVzZXJMYXN0TmFtZSI6IkxvemFubyIsInVzZXJFbWFpbCI6ImdhbG96YW5vQGtlbGdhbC5jb20iLCJ1c2VyUGFzc3dvcmQiOiJndWFzdGEiLCJpYXQiOjE0MjE3MTY5MDZ9.hP-mpswf2MTU9EehIxJ9dwI7uIgiVXVWrYEXUG4S6kQ';


function addUser() {

    //var url = 'http://localhost:3000' + configCSM.urls.users.main + configCSM.urls.users.createUser;
    var url = 'http://colibri.kelgal.com' + configCSM.urls.users.main + configCSM.urls.users.createUser;

    var newUser = {
        "userFirstName":"Camila",
        "userLastName":"Lopez",
        "userEmail":"camila.lopezz@gmail.com",
        "userPassword":"gusti",
        "companyId":1
    };

    request.post({url:url, form:newUser}, function (err, resp, body) {

        console.log(err);
        //console.log(resp);
        console.log(body);
    });
}

function createTerminal( ) {

    //var urlCrane = 'http://localhost:3000' + configCSM.urls.cranes.main + configCSM.urls.cranes.createCraneSchema;
    //var urlCrane = 'http://colibri.kelgal.com' + configCSM.urls.cranes.main + configCSM.urls.cranes.createCraneSchema;

    //var urlBerth = 'http://localhost:3000' + configCSM.urls.terminals.main + configCSM.urls.terminals.createTerminalSchema;
    //var urlBerth = 'http://colibri.kelgal.com'  + configCSM.urls.terminals.main + configCSM.urls.terminals.createTerminalSchema;

    //var urlTerminal = 'http://localhost:3000' + configCSM.urls.terminals.main + configCSM.urls.terminals.createTerminal;
    //var urlTerminal = 'http://colibri.kelgal.com' + configCSM.urls.terminals.main + configCSM.urls.terminals.createTerminal;

    var berthSchema = {
        "terminalConfigSchemaName": "TestSchema",
        "berths":[{
            "berthName": "Berth 1",
            "berthLength":500,
            "berthSequence":1,
            "berthStart":true
        }, {
            "berthName": "Berth 2",
            "berthLength":400,
            "berthSequence":2,
            "berthStart":false
        }, {
            "berthName": "Berth 3",
            "berthLength":300,
            "berthSequence":3,
            "berthStart":true
        }]
    };

    var craneSchema = {
        "craneConfigSchemaName": "TestSchema",
        "cranes":[{
            "craneName": "Crane 1"
        }, {
            "craneName": "Crane 2"
        }]
    };

    var terminal = {
        "terminalName":"Test Terminal"
    };

    var optionsCrane = {
        url:urlCrane,
        headers:{"authorization":"Bearer " + userToken},
        form:{data:JSON.stringify(craneSchema)}
    };

    request.post(optionsCrane, function (err, resp, body) {

        console.log(body);
        var parseBody = JSON.parse(body);
        terminal.craneConfigSchemaId = parseBody.data.craneConfigSchemaId;

        var optionsBerths = {
            url:urlBerth,
            headers:{"authorization":"Bearer " + userToken},
            form:{data:JSON.stringify(berthSchema)}
        };

        request.post(optionsBerths, function (err, resp, body) {

            console.log(body);
            var parseBody = JSON.parse(body);
            terminal.terminalConfigSchemaId = parseBody.data.terminalConfigSchemaId;

            var optionsTerminal = {
                url:urlTerminal,
                headers:{"authorization":"Bearer " + userToken},
                form:{data:JSON.stringify(terminal)}
            };

            request.post(optionsTerminal, function (err, resp, body) {

                console.log(body);
            });
        });
    });
}

function addTerminalAccess( ) {

    //var urlSec = 'http://localhost:3000' + configCSM.urls.security.main + configCSM.urls.security.addTerminalAccess;
    var urlSec = 'http://colibri.kelgal.com' + configCSM.urls.security.main + configCSM.urls.security.addTerminalAccess;

    var addTerminalAccess = {
        terminalId: 1,
        rolId:4
    };

    var options = {
        url:urlSec,
        headers:{"authorization":"Bearer " + userToken},
        form:{data:JSON.stringify(addTerminalAccess)}
    };

    request.post(options, function (err, resp, body) {

        console.log(err);
        console.log(resp);
        console.log(body);
    });

}

//addTerminalAccess();
//createTerminal();
addUser();