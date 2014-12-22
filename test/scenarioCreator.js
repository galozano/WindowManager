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

var berths = [
    {
        berthId:1,
        berthName: "Berth 1",
        berthLength:200,
        terminalConfigSchemaId:1,
        sequence:5,
        berthStart:false
    },
    {
        berthId:2,
        berthName: "Berth 2",
        berthLength:200,
        terminalConfigSchemaId:1,
        sequence:2,
        berthStart:false
    },
    {
        berthId:3,
        berthName: "Berth 3",
        berthLength:200,
        terminalConfigSchemaId:1,
        sequence:3,
        berthStart:false
    },
    {
        berthId:4,
        berthName: "Berth 4",
        berthLength:200,
        terminalConfigSchemaId:1,
        sequence:1,
        berthStart:true
    },
    {
        berthId:5,
        berthName: "Berth 5",
        berthLength:200,
        terminalConfigSchemaId:1,
        sequence:4,
        berthStart:false
    },
    {
        berthId:6,
        berthName: "Marginal 1",
        berthLength:800,
        terminalConfigSchemaId:2,
        sequence:1,
        berthStart:true
    },
    {
        berthId:7,
        berthName: "Espigon 1",
        berthLength:200,
        terminalConfigSchemaId:2,
        sequence:2,
        berthStart:true
    },
    {
        berthId:8,
        berthName: "Espigon 2",
        berthLength:200,
        terminalConfigSchemaId:2,
        sequence:3,
        berthStart:true
    }
];

var configurationsSchemas = [
    {
        terminalConfigSchemaId:1,
        terminalConfigSchemaName: "Config 1"
    },
    {
        terminalConfigSchemaId:2,
        terminalConfigSchemaName: "Config 2"
    }
];

var terminals = [
    {
        terminalName:"SPRC",
        terminalId:1,
        terminalConfigSchemaId:2
    },
    {
        terminalName:"Contecar",
        terminalId:2,
        terminalConfigSchemaId:1
    }
];

var events = [
    {
        eventName:"Servicio Longanisa",
        arrivingTime:"07:00",
        duration:50,
        eventStart:300,
        eventLength:100,
        day:3,
        terminalId:1,
        berthId:6
    },
    {
        eventName:"Servicio el huerto",
        arrivingTime:"11:00",
        duration:20,
        eventStart:500,
        eventLength:200,
        day:5,
        terminalId:1,
        berthId:6
    },
    {
        eventName:"Servicio Noche",
        arrivingTime:"20:00",
        duration:20,
        eventStart:200,
        eventLength:400,
        day:1,
        terminalId:2,
        berthId:4
    },
    {
        eventName:"Servicio Prueba 5",
        arrivingTime:"14:00",
        duration:80,
        eventStart:500,
        eventLength:600,
        day:4,
        terminalId:2,
        berthId:4
    }
];

//-------------------------------------------------------------
// Events
//-------------------------------------------------------------

function clearDatabase (callback) {

    var deleteEvents = "DELETE FROM Events";
    var deleteTerminals = "DELETE FROM Terminals";
    var deleteBerths = "DELETE FROM Berths";
    var deleteTerminalConfigSchema = "DELETE FROM TerminalConfigSchema";


    connection.beginTransaction(function(err) {
        if (err) { throw err; }

        connection.query(deleteEvents, function(err, result) {

            if (err) {
                console.log(err);
                connection.rollback(function() {
                    throw err;
                });
            }
            console.log("Events Deleted");

            connection.query(deleteTerminals, function(err, result) {

                if (err) {
                    console.log(err);
                    connection.rollback(function() {
                        throw err;
                    });
                }

                console.log("Terminals Deleted");


                connection.query(deleteBerths, function(err, result) {

                    if (err) {
                        console.log(err);
                        connection.rollback(function () {
                            throw err;
                        });
                    }


                    connection.query(deleteTerminalConfigSchema, function(err, result) {

                        if (err) {
                            console.log(err);
                            connection.rollback(function () {
                                throw err;
                            });
                        }

                        callback();

                    });

                });

            });

        });

    });

};

function insertTerminalConfSchema(configSchema,callback) {

    console.log("Inserting Terminals Configurations Schemas");

    var insertConfSchema = "INSERT INTO TerminalConfigSchema (terminalConfigSchemaId,terminalConfigSchemaName) VALUES (:terminalConfigSchemaId,:terminalConfigSchemaName)"

    connection.query(insertConfSchema, configSchema, function(err, result) {

        if(err) {
            console.log(err);

            connection.rollback(function() {
                throw err;
            });
        }
        else {
            callback();
        }
    });
}

function insertBerths(berth, callback) {

    console.log("Inserting Terminals Berths");

    var insertBerth = "INSERT INTO Berths (berthId,berthName,berthLength,terminalConfigSchemaId,sequence,berthStart) VALUES (:berthId,:berthName,:berthLength,:terminalConfigSchemaId,:sequence,:berthStart)";

    connection.query(insertBerth, berth, function(err, result) {

        if(err) {

            console.log(err);

            connection.rollback(function() {
                throw err;
            });
        }
        else {
            callback();
        }
    });
}


function insertTerminalsSQL(terminal,callback) {

    console.log("Inserting Terminals");
    var insertQuery = "INSERT INTO Terminals (terminalId,terminalName,terminalConfigSchemaId) VALUES (:terminalId,:terminalName,:terminalConfigSchemaId)";

    connection.query(insertQuery, terminal, function(err, result) {

        if(err) {

            console.log(err);
            connection.rollback(function() {
                throw err;
            });
        }
        else {
            callback();
        }
    });

}

function insertEventSQL(event,callback) {

    var insertQuery = "INSERT INTO Events (eventName,arrivingTime,duration,eventStart,eventLength,day,terminalId,berthId) " +
        "VALUES (:eventName,:arrivingTime,:duration,:eventStart,:eventLength,:day,:terminalId,:berthId)";

    connection.query(insertQuery, event, function(err, result) {

        if(err) {

            console.log(err);

            connection.rollback(function() {
                throw err;
            });
        }
        else {

            event.eventId = result.insertId;
            callback();
        }
    });
}


var waiting = 0;

function insertInformation (events,complete) {

    console.log("Inserting Information to Database");

    connection.beginTransaction(function(err) {


        for(var l = 0 ; l < configurationsSchemas.length ; l++)
        {
            var configSchema = configurationsSchemas[l];
            waiting++;

            insertTerminalConfSchema(configSchema, function() {
                waiting--;
            });

        }

        console.log("All terminals Confs Schemas Inserted");

        for(var k = 0 ; k < berths.length ; k++)
        {
            var berth = berths[k];

            waiting++;
            insertBerths(berth, function() {
                waiting--;
            });
        }

        console.log("All terminals Confs Inserted");


        for(var j = 0 ; j < terminals.length ; j++)
        {
            var terminal = terminals[j];
            waiting++;

            insertTerminalsSQL(terminal,function(){
                waiting--;
            });

        }

        console.log("All terminals Inserted");

        for(var i = 0 ; i < events.length ; i++)
        {
            var event = events[i];
            waiting++;

            insertEventSQL(event,function(){
                waiting--;
                complete(events);
            });
        }


        connection.commit(function(err) {
            if (err) {
                connection.rollback(function () {
                    throw err;
                });
            }
        });
    });
};



exports.prepareScenario = function(callback) {
    clearDatabase(function() {

        insertInformation(events, function(events) {
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









