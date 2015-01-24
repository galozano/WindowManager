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

    craneServerService.createCraneConfigSchema = function createCraneConfigSchema (data,connection) {

        var deferred = q.defer();

        connection.beginTransaction(function(err) {

            if (err) {
                logger.error("Pool Error:" + JSON.stringify(err));
                deferred.reject(configCSM.errors.DATABASE_ERROR);
                return;
            }

            var craneConfigInsertedId = -1;
            var craneConfigData = {
                craneConfigSchemaName: data.craneConfigSchemaName
            };

            addCraneConfigSchema(craneConfigData,connection).then(function(result){

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

        });

        return  deferred.promise;
    };

    return craneServerService;
};