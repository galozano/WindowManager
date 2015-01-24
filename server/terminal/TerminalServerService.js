/**
 * Created by gal on 1/21/15.
 */
module.exports = function(express,poolConnections,logger,configCSM,q) {

    //---------------------------------------------------------------------------------
    // Variables
    //---------------------------------------------------------------------------------

    var terminalServerService = {};

    terminalServerService.getTerminalConfigSchema =  function getTerminalConfigSchema(configSchemaId,connection) {

        var deferred = q.defer();
        var selectSchemaQuery = "SELECT TCS.terminalConfigSchemaId, TCS.terminalConfigSchemaName,B.berthId,B.berthName,B.berthLength,B.berthStart,B.berthSequence" +
            " FROM TerminalConfigSchema TCS INNER JOIN Berths B" +
            " ON B.terminalConfigSchemaId = TCS.terminalConfigSchemaID" +
            " WHERE TCS.terminalConfigSchemaId = :terminalConfigSchemaId";

        var terminalConfigSchemaIdJSON = {
            terminalConfigSchemaId:configSchemaId
        };

        var resultJSON = {};

        connection.query(selectSchemaQuery, terminalConfigSchemaIdJSON, function (err, result) {

            if (err) {
                logger.error("ERROR:" + JSON.stringify(err));
                deferred.reject(configCSM.errors.DATABASE_ERROR);
            }
            else {

                resultJSON.terminalConfigSchemaId   = result[0].terminalConfigSchemaId;
                resultJSON.terminalConfigSchemaName = result[0].terminalConfigSchemaName;

                result.forEach(function(element){
                    delete element.terminalConfigSchemaId;
                    delete element.terminalConfigSchemaName;
                });

                resultJSON.berths = result;
                deferred.resolve(resultJSON);
            }
        });

        return  deferred.promise;
    };

    terminalServerService.addBerth = function addBerth(berth,connection) {

        var deferred = q.defer();
        var insertBerthsSQL = "INSERT INTO Berths (berthName,berthLength,berthStart,berthSequence,terminalConfigSchemaId) VALUES (:berthName,:berthLength,:berthStart,:berthSequence,:terminalConfigSchemaId)";

        connection.query(insertBerthsSQL, berth, function (err, result) {

            if (err) {
                logger.error("ERROR:" + JSON.stringify(err));
                deferred.reject(configCSM.errors.DATABASE_ERROR);
            }
            else {
                deferred.resolve(result);
            }
        });

        return  deferred.promise;
    };


    terminalServerService.addTerminalConfigSchema = function addTerminalConfigSchema(terminalConfig,connection) {

        var deferred = q.defer();
        var insertConfigSchemaSQL = "INSERT INTO TerminalConfigSchema (terminalConfigSchemaName) VALUES (:terminalConfigSchemaName)";

        connection.query(insertConfigSchemaSQL, terminalConfig, function (err, result) {

            if (err) {
                logger.error("ERROR:" + JSON.stringify(err));
                deferred.reject(configCSM.errors.DATABASE_ERROR);
            }
            else {
                deferred.resolve(result);
            }
        });

        return  deferred.promise;
    };

    return terminalServerService;
};