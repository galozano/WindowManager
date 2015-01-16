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

        var deleteQueries = {
            deleteEventsCranes: "DELETE FROM EventsCranes",
            deleteTerminalAccess:"DELETE FROM TerminalAccess",
            deleteEvents:"DELETE FROM Events",
            deleteTerminals:"DELETE FROM Terminals",
            deleteBerths: "DELETE FROM Berths",
            deleteTerminalConfigSchema:"DELETE FROM TerminalConfigSchema",
            deleteCranes: "DELETE FROM Cranes",
            deleteCraneConfigSchema: "DELETE FROM CraneConfigSchema",
            deleteDayName: "DELETE FROM Day",
            deleteUsers: "DELETE FROM Users",
            deleteRol:"DELETE FROM Rol",
            deleteRolType:"DELETE FROM RolType"
        };

        var deletePromises = [];

        for(var deleteQuery in deleteQueries){
            deletePromises.push(q.ninvoke(connection, "query", deleteQueries[deleteQuery]));
        }

        q.all(deletePromises).then(function(){
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

        var insertQueries = {
            insertDayName: {
                query:"INSERT INTO Day (dayId,dayName) VALUES (:dayId,:dayName)",
                value:scenario.day
            },
            insertTerminalSchema: {
                query:"INSERT INTO TerminalConfigSchema (terminalConfigSchemaId,terminalConfigSchemaName) VALUES (:terminalConfigSchemaId,:terminalConfigSchemaName)",
                value:scenario.terminalConfigurationsSchemas
            },
            insertCraneSchema:{
                query:"INSERT INTO CraneConfigSchema (craneConfigSchemaId,craneConfigSchemaName) VALUES (:craneConfigSchemaId,:craneConfigSchemaName)",
                value:scenario.craneConfigurationSchemas
            },
            insertBerth:{
                query:"INSERT INTO Berths (berthId,berthName,berthLength,terminalConfigSchemaId,berthSequence,berthStart) VALUES (:berthId,:berthName,:berthLength,:terminalConfigSchemaId,:berthSequence,:berthStart)",
                value:scenario.berths
            },
            insertTerminals:{
                query:"INSERT INTO Terminals (terminalId,terminalName,terminalConfigSchemaId,craneConfigSchemaId) VALUES (:terminalId,:terminalName,:terminalConfigSchemaId,:craneConfigSchemaId)",
                value:scenario.terminals
            },
            insertEvents: {
                query:"INSERT INTO Events (eventId,eventName,eventArrivingTime,eventDuration,eventStart,eventLength,eventDay,terminalId,berthId) " +
                    "VALUES (:eventId,:eventName,:eventArrivingTime,:eventDuration,:eventStart,:eventLength,:eventDay,:terminalId,:berthId)",
                value:scenario.events
            },
            insertCranes: {
                query:"INSERT INTO Cranes (craneId,craneName,craneConfigSchemaId) VALUES (:craneId,:craneName,:craneConfigSchemaId)",
                value:scenario.cranes
            },
            insertCranesEvents: {
                query:"INSERT INTO EventsCranes (craneId,eventId) VALUES (:craneId,:eventId)",
                value:scenario.eventsCranes
            },
            insertRolType: {
                query:"INSERT INTO RolType (rolTypeId,rolTypeName) VALUES (:rolTypeId,:rolTypeName)",
                value:scenario.rolType
            },
            insertRol: {
                query:"INSERT INTO Rol (rolId,rolTypeId) VALUES (:rolId,:rolTypeId)",
                value:scenario.rol
            },
            insertUsers: {
                query:"INSERT INTO Users (userId,userFirstName,userLastName,userEmail,userPassword,userToken,rolId) VALUES (:userId,:userFirstName,:userLastName,:userEmail,:userPassword,:userToken,:rolId)",
                value:scenario.users
            },
            insertTerminalAccess:{
                query:"INSERT INTO TerminalAccess (terminalAccessId,terminalId,rolId) VALUES (:terminalAccessId,:terminalId, :rolId)",
                value:scenario.terminalAccess
            }
        };

        connection.beginTransaction(function(err) {

            var insertPromises = [];

            for(var insertInfo in insertQueries) {

                var promises = generalInsertion(insertQueries[insertInfo].query,insertQueries[insertInfo].value,insertInfo);
                insertPromises = insertPromises.concat(promises);
            }

            q.all(insertPromises).then(function(){
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
                connection.rollback(function () {
                    throw err;
                });
                reject(err);
            });
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