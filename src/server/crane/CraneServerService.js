/**
 * Created by gal on 1/22/15.
 */
module.exports = function(express, poolConnections, logger, configCSM, q) {

    //---------------------------------------------------------------------------------
    // Variables
    //---------------------------------------------------------------------------------

    var craneServerService = {};

    //---------------------------------------------------------------------------------
    // Private Methods
    //---------------------------------------------------------------------------------

    function addCraneConfigSchema(craneName,connection) {
        var deferred = q.defer();
        var insertConfigSQL = "INSERT INTO CraneConfigSchema (craneConfigSchemaName) VALUES (:craneConfigSchemaName)";

        connection.query(insertConfigSQL, craneName, function (err, result) {

            if (err) {
                logger.error("ERROR:" + JSON.stringify(err));
                deferred.reject(configCSM.errors.DATABASE_ERROR);
            }
            else {
                deferred.resolve(result);
            }
        });

        return deferred.promise;
    }

    function addCrane(crane,connection) {
        var deferred = q.defer();
        var insertCraneSQL = "INSERT INTO Cranes (craneName,craneConfigSchemaId) VALUES (:craneName,:craneConfigSchemaId)";

        connection.query(insertCraneSQL, crane, function (err, result) {

            if (err) {
                logger.error("ERROR:" + JSON.stringify(err));
                deferred.reject(configCSM.errors.DATABASE_ERROR);
            }
            else {
                deferred.resolve(result);
            }
        });

        return deferred.promise;
    }

    function getCraneConfig(craneConfigId,connection) {

       var deferred = q.defer();
       var selectSchemaQuery = "SELECT CCS.craneConfigSchemaId, CCS.craneConfigSchemaName,C.craneId,C.craneName" +
           " FROM CraneConfigSchema CCS INNER JOIN Cranes C" +
           " ON C.craneConfigSchemaId = CCS.craneConfigSchemaId" +
           " WHERE CCS.craneConfigSchemaId = :craneConfigSchemaId";

       var craneConfigSchemaIdJSON = {
           craneConfigSchemaId:craneConfigId
       };

       var resultJSON = {};

       connection.query(selectSchemaQuery, craneConfigSchemaIdJSON, function (err, result) {

           if (err) {
               logger.error("ERROR:" + JSON.stringify(err));
               deferred.reject(configCSM.errors.DATABASE_ERROR);
           }
           else {

               resultJSON.craneConfigSchemaId   = result[0].craneConfigSchemaId;
               resultJSON.craneConfigSchemaName = result[0].craneConfigSchemaName;

               result.forEach(function(element){
                   delete element.craneConfigSchemaId;
                   delete element.craneConfigSchemaName;
               });

               resultJSON.cranes = result;
               deferred.resolve(resultJSON);
           }
       });

       return  deferred.promise;
   }

    //---------------------------------------------------------------------------------
    // Public Methods
    //---------------------------------------------------------------------------------

    craneServerService.insertEventsCranes = function insertEventsCranes(eventId, cranes,connection) {

        logger.debug("Insert All Cranes:" +JSON.stringify(cranes));

        var promiseList = [];
        var insertQuery = "INSERT INTO EventsCranes (eventId,craneId) VALUES (:eventId,:craneId)";

        for(var i = 0; i < cranes.length ; i++) {

            var crane = cranes[i];
            var eventCrane = {eventId:eventId,craneId:crane.craneId};

            promiseList.push(q.ninvoke(connection,"query",insertQuery,eventCrane));
        }

        return promiseList;
    };

    craneServerService.createCraneConfigSchema = function createCraneConfigSchema (data,connection) {

        logger.debug("Received Data:" +JSON.stringify(data));
        var deferred = q.defer();

        connection.beginTransaction(function(err) {

            if (err) {
                logger.error("Pool Error:" + JSON.stringify(err));
                deferred.reject(configCSM.errors.DATABASE_ERROR);
            }
            else {
                var craneConfigInsertedId = -1;
                var craneConfigData = {
                    craneConfigSchemaName: data.craneConfigSchemaName
                };

                addCraneConfigSchema(craneConfigData,connection).then(function(result){

                    logger.debug("Add Crane Config Result:" +JSON.stringify(result));

                    craneConfigInsertedId = result.insertId;
                    var cranes = data.cranes;
                    var promises = [];

                    cranes.forEach(function(element){

                        logger.debug("Crane Element:" +JSON.stringify(element));
                        element.craneConfigSchemaId = craneConfigInsertedId;
                        logger.debug("Crane Element 2:" +JSON.stringify(element));

                        promises.push(addCrane(element,connection));
                    });

                    return promises;

                }).then(function(result){

                    logger.debug("Add Cranes:" +JSON.stringify(result));
                    return getCraneConfig(craneConfigInsertedId,connection);

                }).then(function(result){
                    connection.commit(function(err) {
                        if (err) {
                            connection.rollback(function() {
                                logger.error("Commit Error:" + JSON.stringify(err));
                                deferred.reject(configCSM.errors.DATABASE_ERROR);
                            });
                        }
                        else {

                            logger.info("Callback:" + JSON.stringify(result));
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

        return  deferred.promise;
    };

    craneServerService.deleteCraneConfigSchema = function deleteCraneConfigSchema(data, connection){

        logger.debug("Data Service:" +JSON.stringify(data));
        var deferred = q.defer();

        var deleteCraneSchemaSQL = "DELETE FROM CraneConfigSchema WHERE craneConfigSchemaId = :craneConfigSchemaId";
        var deleteCranes = "DELETE FROM Cranes WHERE craneConfigSchemaId = :craneConfigSchemaId";

        connection.beginTransaction(function(err){

            if (err) {
                logger.error("Pool Error:" + JSON.stringify(err));
                deferred.reject(configCSM.errors.DATABASE_ERROR);
            }
            else {
                q.ninvoke(connection, "query", deleteCranes, data).then(function(result){

                    logger.debug("Query 1 result:" + JSON.stringify(result));
                    return  q.ninvoke(connection, "query", deleteCraneSchemaSQL, data);

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
                            logger.info("Callback:" + JSON.stringify(result));
                            deferred.resolve([]);
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

        return  deferred.promise;
    };

    craneServerService.getCranesSchemasConfigs = function getCranesSchemasConfigs(connection) {

        var deferred = q.defer();

        var sqlQuery = "SELECT CCS.craneConfigSchemaId, CCS.craneConfigSchemaName, C.craneId, C.craneName" +
            " FROM CraneConfigSchema CCS INNER JOIN Cranes C " +
            " ON CCS.craneConfigSchemaId = C.craneConfigSchemaId " +
            " ORDER BY CCS.craneConfigSchemaId";

        q.ninvoke(connection, "query", sqlQuery).then(function(result){

            var resultList = result[0];
            var sentJSON = [];

            var lastConfigSchema;

            resultList.forEach(function(element){

                if(!lastConfigSchema || lastConfigSchema.craneConfigSchemaId != element.craneConfigSchemaId) {

                    if(lastConfigSchema)
                        sentJSON.push(lastConfigSchema);

                    lastConfigSchema = {};
                    lastConfigSchema.craneConfigSchemaId = element.craneConfigSchemaId;
                    lastConfigSchema.craneConfigSchemaName = element.craneConfigSchemaName;
                    lastConfigSchema.cranes = [];

                    var newCrane = {};

                    newCrane.craneId = element.craneId;
                    newCrane.craneName = element.craneName;

                    lastConfigSchema.cranes.push(newCrane);
                }
                else if(lastConfigSchema.craneConfigSchemaId == element.craneConfigSchemaId){

                    var newCrane = {};

                    newCrane.craneId = element.craneId;
                    newCrane.craneName = element.craneName;

                    lastConfigSchema.cranes.push(newCrane);
                }
            });


            if(lastConfigSchema)
                sentJSON.push(lastConfigSchema);

            deferred.resolve(sentJSON);

        }).fail(function(err){
            if (err) {
                logger.error("ERROR:" + JSON.stringify(err));
                deferred.reject(configCSM.errors.DATABASE_ERROR);
            }
        });

        return deferred.promise;
    };

    return craneServerService;
};