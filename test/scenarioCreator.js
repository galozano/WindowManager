/**
 * Created by gal on 11/29/14.
 */

var mysql = require('mysql');
var q = require('q');
var configCSM = require('../server/conf/config.json');
var scenario = require('../test/scenario.json');

//-------------------------------------------------------------
// Connections
//-------------------------------------------------------------

connection = mysql.createConnection(configCSM.dbConn.test);

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
// Clear Database
//-------------------------------------------------------------

function clearDatabase( ) {
    return q.Promise(function(resolve, reject, notify) {

        var deleteEventsCranes = "DELETE FROM EventsCranes"
        var deleteEvents = "DELETE FROM Events";
        var deleteTerminals = "DELETE FROM Terminals";
        var deleteBerths = "DELETE FROM Berths";
        var deleteTerminalConfigSchema = "DELETE FROM TerminalConfigSchema";
        var deleteCranes = "DELETE FROM Cranes";
        var deleteCraneConfigSchema = "DELETE FROM CraneConfigSchema";

        q.ninvoke(connection, "query", deleteEventsCranes).then(function(){
            console.log("Events Cranes Deleted");
            return q.ninvoke(connection, "query", deleteEvents);
        }).then(function(result){
            console.log("Events Deleted");
            return  q.ninvoke(connection, "query", deleteTerminals);
        }).then(function(result){
            console.log("Terminals Deleted");
            return  q.ninvoke(connection, "query", deleteBerths);
        }).then(function(result){
            console.log("Berths Deleted");
            return  q.ninvoke(connection, "query", deleteTerminalConfigSchema);
        }).then(function(result){
            console.log("Terminal Config Deleted");
            return  q.ninvoke(connection, "query", deleteCranes);
        }).then(function(result){
            console.log("Cranes Deleted");
            return  q.ninvoke(connection, "query", deleteCraneConfigSchema);
        }).then(function(result){
            console.log("Crane Config Schema Deleted");
            resolve("===========ALL TABLES DELETED==========");
        }).fail(function(err){
            console.log(err);
            reject(err);
        });
    });
}

//-------------------------------------------------------------
// Insertion into tables
//-------------------------------------------------------------

function generalInsertion(sqlInsert,arrayValues,logMessage) {
    var promises = [];

    for(var i = 0 ; i < arrayValues.length; i++) {
        var value = arrayValues[i];

        console.log(logMessage+ ":" + JSON.stringify(value));
        promises.push(q.ninvoke(connection, "query", sqlInsert, value));
    }

    return promises;
}

function insertInformation ( ) {
    return q.Promise(function(resolve, reject, notify) {
        console.log("========Inserting Information to Database========");

        connection.beginTransaction(function(err) {

            var insertConfSchema = "INSERT INTO TerminalConfigSchema (terminalConfigSchemaId,terminalConfigSchemaName) VALUES (:terminalConfigSchemaId,:terminalConfigSchemaName)"
            var insertPromises = generalInsertion(insertConfSchema,scenario.terminalConfigurationsSchemas,"Inserting Terminal Config Schema");;

            q.all(insertPromises).then(function(){

                var insertConfSchema = "INSERT INTO CraneConfigSchema (craneConfigSchemaId,craneConfigSchemaName) VALUES (:craneConfigSchemaId,:craneConfigSchemaName)";
                return generalInsertion(insertConfSchema,scenario.craneConfigurationSchema,"Inserting Crane Config");

            }).then(function(){
                //Insert all the Berths
                var insertBerth = "INSERT INTO Berths (berthId,berthName,berthLength,terminalConfigSchemaId,sequence,berthStart) VALUES (:berthId,:berthName,:berthLength,:terminalConfigSchemaId,:sequence,:berthStart)";
                return generalInsertion(insertBerth,scenario.berths,"Inserting Berths");

            }).then(function(){
                //Insert all the Terminals
                var insertTerminals = "INSERT INTO Terminals (terminalId,terminalName,terminalConfigSchemaId,craneConfigSchemaId) VALUES (:terminalId,:terminalName,:terminalConfigSchemaId,:craneConfigSchemaId)";
                return generalInsertion(insertTerminals,scenario.terminals,"Inserting Terminals");

            }).then(function(){

                var insertEvents = "INSERT INTO Events (eventId,eventName,eventArrivingTime,eventDuration,eventStart,eventLength,eventDay,terminalId,berthId) " +
                    "VALUES (:eventId,:eventName,:eventArrivingTime,:eventDuration,:eventStart,:eventLength,:eventDay,:terminalId,:berthId)";
                return generalInsertion(insertEvents,scenario.events,"Inserting Events");

            }).then(function(){

                var insertCranes = "INSERT INTO Cranes (craneId,craneName,craneConfigSchemaId) VALUES (:craneId,:craneName,:craneConfigSchemaId)";
                return generalInsertion(insertCranes,scenario.cranes,"Inserting Crane");

            }).then(function(){

                var insertCranesEvents = "INSERT INTO EventsCranes (craneId,eventId) VALUES (:craneId,:eventId)";
                return generalInsertion(insertCranesEvents,scenario.eventsCranes,"Inserting Crane Events");

            }).then(function(){
                connection.commit(function(err) {
                    if (err) {
                        connection.rollback(function () {
                            throw err;
                        });
                    }
                    resolve("======COMMIT All INSERTED========");
                });
            }).fail(function(err){
                console.log(err);
                reject(err);
            }).done();
        });
    });
};

exports.prepareScenario = function(callback) {
    clearDatabase().then(function(result) {
        console.log(result)
        return insertInformation( );
    }).then(function(result){
        console.log(result);
        callback(scenario.events);
    });
};

exports.prepareScenario(function( ) {

    console.log("OK");
});