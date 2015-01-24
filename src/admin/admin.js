/**
 * Created by gal on 1/19/15.
 */

var request = require('request');
var configCSM = require('../../server/conf/config.json');

function addUser() {

    var url = 'http://localhost:3000' + configCSM.urls.users.main + configCSM.urls.users.createUser;
    //var url = 'http://colibri.kelgal.com' + configCSM.urls.users.main + configCSM.urls.users.createUser;

    var newUser = {
        "userFirstName":"Gustavo",
        "userLastName":"Lozano",
        "userEmail":"galozano@kelgal.com",
        "userPassword":"guasta"
    };

    request.post({url:url, form:newUser}, function (err, resp, body) {

       console.log(body);
    });
}

function createTerminal( ) {




};



//addUser();