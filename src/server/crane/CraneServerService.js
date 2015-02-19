/**
 * Created by gal on 1/22/15.
 */
module.exports = function(express, poolConnections, logger, configCSM, q, securityServerService,eventServerService) {

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
        var insertCraneSQL = "INSERT INTO Cranes (craneName,craneConfigSchemaId,craneGrossProductivity) " +
            " VALUES (:craneName,:craneConfigSchemaId,:craneGrossProductivity)";

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

       var selectSchemaQuery = "SELECT CCS.craneConfigSchemaId, CCS.craneConfigSchemaName,C.craneId,C.craneName, C.craneGrossProductivity " +
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

               logger.debug("getCraneConfig Result:" + JSON.stringify(result));

               if(result && result.length > 0){
                   resultJSON.craneConfigSchemaId   = result[0].craneConfigSchemaId;
                   resultJSON.craneConfigSchemaName = result[0].craneConfigSchemaName;

                   result.forEach(function(element){
                       delete element.craneConfigSchemaId;
                       delete element.craneConfigSchemaName;
                   });

                   resultJSON.cranes = result;
               }

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
        var insertQuery = "INSERT INTO EventsCranes (eventId,craneId,ecAssignedPercentage) VALUES (:eventId,:craneId,:ecAssignedPercentage)";

        for(var i = 0; i < cranes.length ; i++) {

            var crane = cranes[i];
            var eventCrane = {
                eventId:eventId,
                craneId:crane.craneId,
                ecAssignedPercentage:crane.ecAssignedPercentage
            };

            logger.debug("Inserted Crane:" + JSON.stringify(eventCrane));

            promiseList.push(q.ninvoke(connection,"query",insertQuery,eventCrane));
        }

        return promiseList;
    };

    craneServerService.createCraneConfigSchema = function createCraneConfigSchema (data,user,connection) {

        logger.info("CreateCraneConfigSchema Received Data:" +JSON.stringify(data));
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
                    logger.debug("Crane Config Inserted Id:" +JSON.stringify(craneConfigInsertedId));
                    return securityServerService.createCraneSchemaAccess(user,craneConfigInsertedId,connection);

                }).then(function(result){

                    logger.debug("Security Cranes:" + JSON.stringify(result));
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

    craneServerService.getCranesSchemasConfigs = function getCranesSchemasConfigs(user,connection) {

        var deferred = q.defer();

        var userJSON = {
          userId: user.userId
        };

        var sqlQuery = "SELECT CCS.craneConfigSchemaId, CCS.craneConfigSchemaName, C.craneId, C.craneName" +
            " FROM ( SELECT CCS1.craneConfigSchemaId,CCS1.craneConfigSchemaName" +
            " FROM CraneConfigSchema CCS1 INNER JOIN CraneSchemaAccess CSA" +
            " ON CCS1.craneConfigSchemaId = CSA.craneConfigSchemaId WHERE CSA.rolId =" +
            " (SELECT rolId FROM Company C WHERE c.companyId = (SELECT U.companyId FROM Users U WHERE U.userId = :userId))) CCS " +
            " INNER JOIN Cranes C ON CCS.craneConfigSchemaId = C.craneConfigSchemaId" +
            " ORDER BY CCS.craneConfigSchemaId";


        q.ninvoke(connection, "query", sqlQuery, userJSON).then(function(result){

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

    craneServerService.editCranes = function editCranes(data, connection){

        var deferred = q.defer();

        var eventCranes = data;

        var eventId = {eventId:eventCranes.eventId};
        var deleteQuery = "DELETE FROM EventsCranes WHERE eventId = :eventId";

        connection.beginTransaction(function(err){
            q.ninvoke(connection,"query",deleteQuery,eventId).then(function(result){

                logger.debug("Result Delete Query:"+ JSON.stringify(result));
                return craneServerService.insertEventsCranes(eventCranes.eventId,eventCranes.cranes,connection);

            }).then(function(resutl){

                logger.debug("Insert Event Cranes Result:" + JSON.stringify(resutl));

                eventServerService.getSpecificEvent(eventCranes.eventId,connection,function(result){
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

    return craneServerService;
};