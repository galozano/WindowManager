/**
 * Created by gal on 11/29/14.
 */

var mysql = require('mysql');
var q = require('q');
var configCSM = require('../src/server/conf/config.json');
var scenario = require('../test/scenario.json');

//-------------------------------------------------------------
// Connections
//-------------------------------------------------------------

connection = mysql.createConnection({
    "host": process.env.DB_URL,
    "user":process.env.DB_USER,
    "password":process.env.DB_PASS,
    "database": "CSM"
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
            deleteTerminalSchemaAccess:"DELETE FROM TerminalSchemaAccess",
            deleteTerminalConfigSchema:"DELETE FROM TerminalConfigSchema",
            deleteCranes: "DELETE FROM Cranes",
            deleteCraneSchemaAccess:"DELETE FROM CraneSchemaAccess",
            deleteCraneConfigSchema: "DELETE FROM CraneConfigSchema",
            deleteDayName: "DELETE FROM Day",
            deleteUsers: "DELETE FROM Users",
            deleteCompany: "DELETE FROM Company",
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
                query:"INSERT INTO Berths (berthId,berthName,berthLength,terminalConfigSchemaId,berthSequence,berthDraft,berthStart) VALUES (:berthId,:berthName,:berthLength,:terminalConfigSchemaId,:berthSequence,:berthDraft,:berthStart)",
                value:scenario.berths
            },
            insertTerminals:{
                query:"INSERT INTO Terminals (terminalId,terminalName,terminalConfigSchemaId,craneConfigSchemaId) VALUES (:terminalId,:terminalName,:terminalConfigSchemaId,:craneConfigSchemaId)",
                value:scenario.terminals
            },
            insertEvents: {
                query:"INSERT INTO Events (eventId,eventName,eventColor,eventArrivingTime,eventDuration,eventStart,eventLength,eventDay,terminalId,berthId) " +
                    "VALUES (:eventId,:eventName,:eventColor,:eventArrivingTime,:eventDuration,:eventStart,:eventLength,:eventDay,:terminalId,:berthId)",
                value:scenario.events
            },
            insertCranes: {
                query:"INSERT INTO Cranes (craneId,craneName,craneGrossProductivity,craneConfigSchemaId) VALUES (:craneId,:craneName,:craneGrossProductivity,:craneConfigSchemaId)",
                value:scenario.cranes
            },
            insertCranesEvents: {
                query:"INSERT INTO EventsCranes (craneId,eventId,ecAssignedPercentage) VALUES (:craneId,:eventId,:ecAssignedPercentage)",
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
            insertCompanies:{
                query:"INSERT INTO Company (companyId,companyName,rolId) VALUES (:companyId,:companyName,:rolId)",
                value:scenario.companies
            },
            insertUsers: {
                query:"INSERT INTO Users (userId,userFirstName,userLastName,userEmail,userPassword,userToken,rolId,companyId) VALUES (:userId,:userFirstName,:userLastName,:userEmail,:userPassword,:userToken,:rolId,:companyId)",
                value:scenario.users
            },
            insertTerminalAccess:{
                query:"INSERT INTO TerminalAccess (terminalAccessId,terminalId,rolId) VALUES (:terminalAccessId,:terminalId, :rolId)",
                value:scenario.terminalAccess
            },
            insertCraneSchemaAccess:{
                query:"INSERT INTO CraneSchemaAccess (craneSchemaAccessId,craneConfigSchemaId,rolId) VALUES (:craneSchemaAccessId,:craneConfigSchemaId,:rolId)",
                value:scenario.craneSchemaAccess
            },
            insertTerminalSchemaAccess:{
                query:"INSERT INTO TerminalSchemaAccess (terminalSchemaAccessId,terminalConfigSchemaId,rolId) VALUES (:terminalSchemaAccessId,:terminalConfigSchemaId,:rolId)",
                value:scenario.terminalSchemaAccess
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
        console.log(result);
        return insertInformation( );
    }).then(function(result){
        console.log(result);
        callback(scenario.events);
    });
};

//exports.prepareScenario(function( ) {
//
//    console.log("OK");
//});