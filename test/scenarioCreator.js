/**
 * Created by gal on 11/29/14.
 */

var mysql = require('mysql');

//-------------------------------------------------------------
// Connections
//-------------------------------------------------------------

connection = mysql.createConnection({
    host    : 'localhost',
    user    : 'csm',
    password: 'CSM.2014',
    database: 'CSM'
});

connection.config.queryFormat = function (query, values) {
    if (!values) return query;
    return query.replace(/\:(\w+)/g, function (txt, key) {
        if (values.hasOwnProperty(key)) {
            return this.escape(values[key]);
        }
        return txt;
    }.bind(this));
};

//-------------------------------------------------------------
// Connections
//-------------------------------------------------------------

var events = [
    {
        "eventName":"Servicio Longanisa",
        "arrivingTime":"07:00",
        "duration":50,
        "eventStart":300,
        "eventLength":200,
        "day":3
    },
    {
        "eventName":"Servicio el huerto",
        "arrivingTime":"11:00",
        "duration":100,
        "eventStart":500,
        "eventLength":400,
        "day":5
    },
    {
        "eventName":"Servicio Noche",
        "arrivingTime":"20:00",
        "duration":20,
        "eventStart":200,
        "eventLength":400,
        "day":1
    },
    {
        "eventName":"Servicio Prueba 5",
        "arrivingTime":"14:00",
        "duration":80,
        "eventStart":500,
        "eventLength":600,
        "day":4
    }
];

//-------------------------------------------------------------
// Events
//-------------------------------------------------------------

function clearDatabase (callback) {

    var deleteEvents = "DELETE FROM Events";

    connection.query(deleteEvents, function(err, result) {

        if(err) {
            console.log(err);
        }
        else
        {
            console.log("ok");
            callback();
        }
    });
};

var waiting = 0;

function insertEventSQL(event,callback) {

    var insertQuery = "INSERT INTO Events (eventName,arrivingTime,duration,eventStart,eventLength,day) " +
        "VALUES (:eventName,:arrivingTime,:duration,:eventStart,:eventLength,:day)";

    connection.query(insertQuery, event, function(err, result) {

        if(err) {
            console.log(err);
        }
        else {

            event.eventId = result.insertId;
            callback();
        }
    });
}

function insertEvents (events,complete) {

    for(var i = 0 ; i < events.length ; i++)
    {
        var event = events[i];
        waiting++;

        insertEventSQL(event,function(){
            waiting--;
            complete(events);
        });
    }
};

exports.prepareScenario = function(callback) {
    clearDatabase(function() {
        insertEvents(events, function(events) {
            if(waiting == 0) {
                console.log("done");
                callback(events);
            }
        });
    });
};


//exports.prepareScenario(function(events) {
//
//    console.log(events);
//});









