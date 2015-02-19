/**
 * Created by gal on 1/21/15.
 */
module.exports = function(express,poolConnections,logger,configCSM,q, securityService) {

    //---------------------------------------------------------------------------------
    // Variables
    //---------------------------------------------------------------------------------

    /**
     * The terminal service where all the public methods are added
     * @type {{}}
     */
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
    }

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
    }

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
    }

    //---------------------------------------------------------------------------------
    // Public Methods
    //---------------------------------------------------------------------------------

    /**
     * Get all the terminals for a particular User
     * @param connection - connection to the database
     * @param user - logged user
     * @returns {jQuery.promise|promise.promise|d.promise|promise|.ready.promise|Q.promise|*}
     */
    terminalServerService.getTerminals = function getTerminals(connection,user){

        var deferred = q.defer();

        var parameters = {
            rolId: user.rolId
        };

        var query2 = "SELECT T.terminalId, T.terminalName, T.terminalConfigSchemaId, T.craneConfigSchemaId " +
            "FROM Terminals AS T INNER JOIN TerminalAccess AS TA ON TA.terminalId = T.terminalId " +
            "WHERE TA.rolId = :rolId;";

        connection.query(query2,parameters,function(err, result) {

            if(err) {
                logger.error("ERROR:" + err);
                deferred.reject(configCSM.errors.DATABASE_ERROR);
            }
            else {
                logger.info("JSON Sent:" + JSON.stringify(result));
                deferred.resolve(result);
            }
        });

        return deferred.promise;
    };

    /**
     * Get all the information of a terminal with id terminalId
     * @param terminalId - id of the terminal to query
     * @param connection - connection to the database
     * @returns {jQuery.promise|promise.promise|d.promise|promise|.ready.promise|Q.promise|*}
     */
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
        var query3 = "SELECT C.craneId,C.craneName, C.craneGrossProductivity " +
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

    /**
     * Get all the terminals configs schemas
     * @param connection - connection to the database
     * @returns {jQuery.promise|promise.promise|d.promise|promise|.ready.promise|Q.promise|*}
     */
    terminalServerService.getTerminalConfigSchemas = function getTerminalConfigSchemas(user,connection){

        var deferred = q.defer();

        var userJSON = {
            userId: user.userId
        };

        var selectSQL = "SELECT TCS.terminalConfigSchemaId, TCS.terminalConfigSchemaName, B.berthId, B.berthName, B.berthLength, B.berthStart, B.berthSequence" +
            " FROM (SELECT TCS1.terminalConfigSchemaId,TCS1.terminalConfigSchemaName FROM TerminalConfigSchema TCS1 INNER JOIN TerminalSchemaAccess TSA" +
            " ON TCS1.terminalConfigSchemaId = TSA.terminalConfigSchemaId WHERE TSA.rolId = (SELECT rolId" +
            " FROM Company C WHERE c.companyId = (SELECT U.companyId FROM Users U WHERE U.userId = :userId))) " +
            " TCS INNER JOIN Berths B ON B.terminalConfigSchemaId = TCS.terminalConfigSchemaId " +
            " ORDER BY TCS.terminalConfigSchemaId, B.berthSequence";


        q.ninvoke(connection, "query", selectSQL,userJSON).then(function(result){

            var resultList = result[0];
            var sentJSON = [];

            var lastConfigSchema;

            resultList.forEach(function(element){

                if(!lastConfigSchema || lastConfigSchema.terminalConfigSchemaId != element.terminalConfigSchemaId) {

                    if(lastConfigSchema)
                        sentJSON.push(lastConfigSchema);

                    lastConfigSchema = {};
                    lastConfigSchema.terminalConfigSchemaId = element.terminalConfigSchemaId;
                    lastConfigSchema.terminalConfigSchemaName = element.terminalConfigSchemaName;
                    lastConfigSchema.berths = [];

                    var newBerth  = {};

                    newBerth.berthId = element.berthId;
                    newBerth.berthName = element.berthName;
                    newBerth.berthLength =  element.berthLength;
                    newBerth.berthStart = element.berthStart;
                    newBerth.berthSequence = element.berthSequence;

                    lastConfigSchema.berths.push(newBerth);
                }
                else if(lastConfigSchema.terminalConfigSchemaId == element.terminalConfigSchemaId){

                    var newBerth  = {};

                    newBerth.berthId = element.berthId;
                    newBerth.berthName = element.berthName;
                    newBerth.berthLength =  element.berthLength;
                    newBerth.berthStart = element.berthStart
                    newBerth.berthSequence = element.berthSequence;

                    lastConfigSchema.berths.push(newBerth);
                }
            });

            if(lastConfigSchema)
                sentJSON.push(lastConfigSchema);

            deferred.resolve(sentJSON);

        }).fail(function(err){
            if (err) {
                logger.error("ERROR:" + JSON.stringify(err));

                var message = configCSM.errors.DATABASE_ERROR;
                message.message = err;

                deferred.reject(message);
            }
        });

        return  deferred.promise;
    };

    /**
     * Creates a new terminal
     * @param data - new terminal information | JSON format
     * @param connection - connection to the database
     * @returns {jQuery.promise|promise.promise|d.promise|promise|.ready.promise|Q.promise|*}
     */
    terminalServerService.createTerminal = function createTerminal (data, user, connection) {

        logger.debug("Data Service:" + JSON.stringify(data));
        var deferred = q.defer();

        var insertSQL = "INSERT INTO Terminals (terminalName, terminalConfigSchemaId, craneConfigSchemaId) " +
            " VALUES (:terminalName, :terminalConfigSchemaId, :craneConfigSchemaId)";

        connection.beginTransaction(function(err){

            var terminalIdJSON = {};
            if (err) {
                logger.error("Transaction Error::" + JSON.stringify(err));
                deferred.reject(configCSM.errors.DATABASE_ERROR);
            }
            else {

                q.ninvoke(connection, "query", insertSQL, data).then(function(result){

                    logger.debug("Query 1 result:" + JSON.stringify(result));

                    var insertId = result[0].insertId;

                    terminalIdJSON = {
                        terminalId:insertId
                    };

                    return securityService.createTerminalAccess(user,insertId,connection);

                }).then(function(result){

                    logger.debug("Query 2 result:" + JSON.stringify(result));
                    return terminalServerService.getTerminal(terminalIdJSON,connection);

                }).then(function(result){

                    logger.debug("Query 2 result:" + JSON.stringify(result));

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
                    if (err) {
                        connection.rollback(function() {
                            logger.error("Error:" + JSON.stringify(err));
                            deferred.reject(configCSM.errors.DATABASE_ERROR);
                        });
                    }
                });
            }
        });

        return  deferred.promise;
    };

    /**
     * Delete the terminal with the ID sent of data
     * @param data - the info to delete the terminal
     * @param connection - the connection to the database
     * @returns {jQuery.promise|promise.promise|d.promise|promise|.ready.promise|Q.promise|*}
     */
    terminalServerService.deleteTerminal = function deleteTerminal(data,connection) {

        logger.debug("Data Service:" +JSON.stringify(data));
        var deferred = q.defer();

        //var deleteTerminalAccessSQL = "DELETE FROM TerminalAccess WHERE terminalId = :terminalId";
        //var deleteEventsCranesSQL = "DELETE FROM EventsCranes WHERE terminalId = :terminalId";
        //var deleteEventsSQL = "DELETE FROM Events WHERE terminalId = :terminalId";
        var deleteTerminalSQL = "DELETE FROM Terminals WHERE terminalId = :terminalId";

        q.ninvoke(connection, "query", deleteTerminalSQL, data).then(function(result){

            logger.debug("Query 1 result:" + JSON.stringify(result));
            return deferred.resolve([]);

        }).fail(function(err){
            if (err) {
                logger.error("ERROR:" + JSON.stringify(err));
                deferred.reject(configCSM.errors.DATABASE_ERROR);
            }
        });

        return  deferred.promise;
    };

    /**
     * Create a Terminal Config Schema with the requiered berth configuration
     * @param data - the data in form of JSON
     * @param connection - the connection to the database
     * @returns {jQuery.promise|promise.promise|d.promise|promise|.ready.promise|Q.promise|*}
     */
    terminalServerService.createTerminalConfig = function createTerminalConfig(data,user,connection) {

        logger.debug("Data Service:" +JSON.stringify(data));
        var deferred = q.defer();

        var insertedConfigId = -1;
        var terminalConfigNameJSON = {
            terminalConfigSchemaName: data.terminalConfigSchemaName
        };

        connection.beginTransaction(function(err) {

            if (err) {
                logger.error("Transaction Error:" + JSON.stringify(err));
                deferred.reject(configCSM.errors.DATABASE_ERROR);
            }
            else {

                //First add the terminal to the config
                addTerminalConfigSchema(terminalConfigNameJSON,connection).then(function(result){

                    logger.debug("Terminal Config Result:" +JSON.stringify(result));
                    insertedConfigId = result.insertId;

                    logger.debug("Berths:" + JSON.stringify(data.berths));
                    var berths = data.berths;

                    var promises = [];

                    //Add all the berths and create an array of promises
                    berths.forEach(function(element){

                        logger.debug("Berth Element:" +JSON.stringify(element));
                        element.terminalConfigSchemaId = insertedConfigId;
                        logger.debug("Berth Element 2:" +JSON.stringify(element));

                        promises.push(addBerth(element,connection));
                    });

                    return promises;

                }).then(function(result){

                    logger.debug("Terminal Config Result 2:" + JSON.stringify(result));

                    return securityService.createTerminalSchemaAccess(user,insertedConfigId,connection);

                }).then(function(result){

                    logger.debug("Terminal Config Result 3:" + JSON.stringify(result));
                    return getTerminalConfigSchema(insertedConfigId,connection);

                }).then(function(result){

                    logger.debug("Terminal Config Result 4:" + JSON.stringify(result));

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
            }
        });

        return deferred.promise;
    };


    /**
     * Delete the terminal config schema specified in the data
     * @param data - data with the id of the terminal config schema to delete | must be in JSON format
     * @param connection - connection to the database
     * @returns {jQuery.promise|promise.promise|d.promise|promise|.ready.promise|Q.promise|*}
     */
    terminalServerService.deleteTerminalConfigSchema = function deleteTerminalConfigSchema (data, connection) {

        logger.debug("Data Service:" +JSON.stringify(data));
        var deferred = q.defer();

        var deleteSchemaSQL = "DELETE FROM TerminalConfigSchema WHERE terminalConfigSchemaId = :terminalConfigSchemaId ";
        var deleteBerthsSQL = "DELETE FROM Berths WHERE terminalConfigSchemaId = :terminalConfigSchemaId";

        connection.beginTransaction(function(err){
            q.ninvoke(connection, "query", deleteBerthsSQL, data).then(function(result){

                logger.debug("Query result 1:" + JSON.stringify(result));
                return  q.ninvoke(connection, "query", deleteSchemaSQL, data);

            }).then(function(result){

                logger.debug("Query result 2:" + JSON.stringify(result));

                connection.commit(function(err) {
                    if (err) {
                        connection.rollback(function() {
                            logger.error("Commit Error:" + JSON.stringify(err));
                            deferred.reject(configCSM.errors.DATABASE_ERROR);
                        });
                    }
                    else {
                        logger.info("Result:" + JSON.stringify(result));
                        deferred.resolve([]);
                    }
                });
            }).fail(function(err){

                connection.rollback(function() {
                    logger.error("Error:" + JSON.stringify(err));
                    deferred.reject(configCSM.errors.DATABASE_ERROR);
                });
            });

        });

        return  deferred.promise;
    };



    return terminalServerService;
};