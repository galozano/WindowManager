/**
 * Created by gal on 1/21/15.
 */
module.exports = function(express,poolConnections,logger,configCSM,q) {

    //---------------------------------------------------------------------------------
    // Variables
    //---------------------------------------------------------------------------------

    var terminalServerService = {};

    //---------------------------------------------------------------------------------
    // Private Methods
    //---------------------------------------------------------------------------------

    function getTerminalConfigSchema(configSchemaId,connection) {

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

    function addBerth(berth,connection) {

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


    function addTerminalConfigSchema(terminalConfig,connection) {

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

    //---------------------------------------------------------------------------------
    // Public Methods
    //---------------------------------------------------------------------------------

    terminalServerService.getTerminal = function getTerminal(terminalId, connection) {

        var deferred = q.defer();
        var jsonResponse = "";

        var query1 = "SELECT T.terminalId,T.terminalName, TCS.terminalConfigSchemaName, SUM(berthLength) totalLength FROM " +
            "Terminals T, TerminalConfigSchema TCS, Berths B " +
            "WHERE T.terminalConfigSchemaId = TCS.terminalConfigSchemaId " +
            "AND   B.terminalConfigSchemaId = TCS.terminalConfigSchemaId " +
            "AND T.terminalId = :terminalId " +
            "GROUP BY TCS.terminalConfigSchemaName";

        //Get all the berths of the terminal
        var query2 = "SELECT B.berthId, B.berthName, B.berthLength, B.berthSequence, B.berthStart FROM " +
            "Terminals T, TerminalConfigSchema TCS, Berths B " +
            "WHERE T.terminalConfigSchemaId = TCS.terminalConfigSchemaId " +
            "AND   B.terminalConfigSchemaId = TCS.terminalConfigSchemaId " +
            "AND T.terminalId = :terminalId " +
            "ORDER BY B.berthSequence";

        //Get all the cranes of the terminal
        var query3 = "SELECT C.craneId,C.craneName " +
            "FROM Terminals T,CraneConfigSchema CCS,Cranes C " +
            "WHERE T.craneConfigSchemaId = CCS.craneConfigSchemaId " +
            "AND CCS.craneConfigSchemaId = C.craneConfigSchemaId " +
            "AND T.terminalId = :terminalId";

        q.ninvoke(connection, "query", query1,terminalId).then(function(result) {

            logger.debug("Result thrown by query 1:" + JSON.stringify(result));
            jsonResponse = result[0][0];
            logger.debug("Response Construction 1:" + JSON.stringify(jsonResponse));
            return q.ninvoke(connection, "query", query2,terminalId);

        }).then(function(result){
            logger.debug("Result thrown by query 2:" + JSON.stringify(result));
            jsonResponse.berths = result[0];

            logger.debug("Response Construction 2:" + JSON.stringify(jsonResponse));
            return q.ninvoke(connection, "query", query3,terminalId);

        }).then(function(result){
            logger.debug("Result thrown by query 3:" + JSON.stringify(result));
            jsonResponse.cranes = result[0];

            logger.debug("Response Construction 3:" + JSON.stringify(jsonResponse));
            logger.info("JSON sent:" + JSON.stringify(jsonResponse));
            deferred.resolve(jsonResponse);

        }).fail(function(err){
            if(err) {
                logger.error("ERROR:" + err);
                deferred.reject(configCSM.errors.DATABASE_ERROR);
            }
        });

        return  deferred.promise;
    };

    terminalServerService.createTerminal = function createTerminal (data,connection) {

        logger.debug("Data Service:" +JSON.stringify(data));
        var deferred = q.defer();

        var insertSQL = "INSERT INTO Terminals (terminalName, terminalConfigSchemaId, craneConfigSchemaId) " +
            " VALUES (:terminalName, :terminalConfigSchemaId, :craneConfigSchemaId)";

        q.ninvoke(connection, "query", insertSQL, data).then(function(result){

            logger.debug("Query 1 result:" + JSON.stringify(result));
            var insertId = result[0].insertId;

            var terminalIdJson = {
                terminalId:insertId
            };

            return terminalServerService.getTerminal(terminalIdJson,connection);

        }).then(function(result){

            logger.debug("Query 2 result:" + JSON.stringify(result));
            deferred.resolve(result);

        }).fail(function(err){
            if (err) {
                logger.error("ERROR:" + JSON.stringify(err));
                deferred.reject(configCSM.errors.DATABASE_ERROR);
            }
        });

        return  deferred.promise;
    };

    terminalServerService.createTerminalConfig = function createTerminalConfig(data,connection) {

        logger.debug("Data Service:" +JSON.stringify(data));
        var deferred = q.defer();

        var insertedConfigId = -1;
        var terminalConfigNameJSON = {
            terminalConfigSchemaName: data.terminalConfigSchemaName
        };

        connection.beginTransaction(function(err) {

            if (err) {
                logger.error("Pool Error:" + JSON.stringify(err));
                deferred.reject(configCSM.errors.DATABASE_ERROR);
                return;
            }

            addTerminalConfigSchema(terminalConfigNameJSON,connection).then(function(result){

                logger.debug("Terminal Config Result:" +JSON.stringify(result));
                insertedConfigId = result.insertId;

                logger.debug("Berths:" + JSON.stringify(data.berths));
                var berths = data.berths;

                var promises = [];

                berths.forEach(function(element){

                    logger.debug("Berth Element:" +JSON.stringify(element));
                    element.terminalConfigSchemaId = insertedConfigId;
                    logger.debug("Berth Element 2:" +JSON.stringify(element));

                    promises.push(addBerth(element,connection));
                });

                return promises;

            }).then(function(result){

                logger.debug("Terminal Config Result 2:" + JSON.stringify(result));
                return getTerminalConfigSchema(insertedConfigId,connection);

            }).then(function(result){

                logger.debug("Terminal Config Result 3:" + JSON.stringify(result));

                connection.commit(function(err) {
                    if (err) {
                        connection.rollback(function() {
                            logger.error("Commit Error:" + JSON.stringify(err));
                            deferred.reject(configCSM.errors.DATABASE_ERROR);
                        });
                    }
                    else {
                        logger.info("Result:" + JSON.stringify(result));
                        deferred.resolve(result);
                    }
                });

            }).fail(function(err){

                connection.rollback(function() {
                    logger.error("Error:" + JSON.stringify(err));
                    deferred.reject(configCSM.errors.DATABASE_ERROR);
                });
            });
        });

        return deferred.promise;
    };

    return terminalServerService;
};