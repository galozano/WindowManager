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
        "eventName":"Nuevo Evento",
        "arrivingTime":"11:00",
        "duration":50,
        "eventStart":300,
        "eventLength":400,
        "day":3
    },
    {
        "eventName":"Nuevo Evento",
        "arrivingTime":"11:00",
        "duration":50,
        "eventStart":300,
        "eventLength":400,
        "day":3
    },
    {
        "eventName":"Nuevo Evento",
        "arrivingTime":"11:00",
        "duration":50,
        "eventStart":300,
        "eventLength":400,
        "day":3
    },
    {
        "eventName":"Nuevo Evento",
        "arrivingTime":"11:00",
        "duration":50,
        "eventStart":300,
        "eventLength":400,
        "day":3
    }
];

//-------------------------------------------------------------
// Events
//-------------------------------------------------------------

exports.clearDatabase = function ( ) {

    var deleteEvents = "DELETE FROM Events";

    connection.query(deleteEvents, function(err, result) {

        if(err) {
            console.log(err);
        }
        else
        {
            console.log("ok");
        }

    });

};

function insertEventSQL(event, callback) {

    var insertQuery = "INSERT INTO Events (eventName,arrivingTime,duration,eventStart,eventLength,day) " +
        "VALUES (:eventName,:arrivingTime,:duration,:eventStart,:eventLength,:day)";

    connection.query(insertQuery, event, function(err, result) {

        if(err) {
            console.log(err);
        }
        else {

            console.log(result.insertId)
            event.eventId = result.insertId;
        }
    });
}

exports.insertEvents = function ( ) {

    for(var i = 0 ; i < events.length ; i++)
    {
        var event = events[i];

        insertEventSQL(event, function() {

        });
    }
};

exports.clearDatabase();
exports.insertEvents();







