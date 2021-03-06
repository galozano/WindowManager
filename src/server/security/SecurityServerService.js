/**
 * Created by gal on 2/9/15.
 */


module.exports = function (poolConnections, logger, configCSM, q) {

    //---------------------------------------------------------------------------------
    // Variables
    //---------------------------------------------------------------------------------

    var securityServerService = {};

    //---------------------------------------------------------------------------------
    // Private Methods
    //---------------------------------------------------------------------------------


    //---------------------------------------------------------------------------------
    // Public Methods
    //---------------------------------------------------------------------------------

    securityServerService.createTerminalAccess = function createTerminalAccess(user,terminalId,connection) {

        logger.debug("Create Terminal Access by Email:" + JSON.stringify(user));

        var deferred = q.defer();

        var userEmailJSON = {
            userId:user.userId,
            terminalId:terminalId
        };

        var insertQuery = "INSERT INTO TerminalAccess (terminalId, rolId) SELECT B.* FROM (" +
            " SELECT :terminalId terminalId,C.rolId FROM Company C" +
            " WHERE C.companyId = (SELECT U.companyId FROM Users U WHERE U.userId = :userId)) B";

        q.ninvoke(connection,"query", insertQuery, userEmailJSON).then(function(result){

            deferred.resolve();

        }).fail(function(err){
            deferred.reject(err);
        });

        return deferred.promise;
    };

    securityServerService.createCraneSchemaAccess = function createCraneSchemaAccess(user,craneSchemaId,connection){

        logger.debug("Create Crane Schema Access by Email:" + JSON.stringify(user));

        var deferred = q.defer();

        var userEmailJSON = {
            userId:user.userId,
            craneConfigSchemaId:craneSchemaId
        };

        var insertQuery = "INSERT INTO CraneSchemaAccess (craneConfigSchemaId, rolId)" +
            " SELECT B.* FROM ( SELECT :craneConfigSchemaId craneConfigSchemaId, C.rolId FROM Company C" +
            " WHERE C.companyId = (SELECT U.companyId FROM Users U WHERE U.userId = :userId)) B";

        q.ninvoke(connection,"query", insertQuery, userEmailJSON).then(function(result){

            deferred.resolve(result);

        }).fail(function(err){
            deferred.reject(err);
        });

        return deferred.promise;
    };

    securityServerService.createTerminalSchemaAccess = function createTerminalSchemaAccess(user,terminalSchemaId,connection){

        logger.debug("Create Terminal Schema Access by Email:" + JSON.stringify(user));

        var deferred = q.defer();

        var userEmailJSON = {
            userId:user.userId,
            terminalConfigSchemaId:terminalSchemaId
        };

        var insertQuery = "INSERT INTO TerminalSchemaAccess (terminalConfigSchemaId, rolId)" +
            " SELECT B.* FROM ( SELECT :terminalConfigSchemaId terminalConfigSchemaId, C.rolId FROM Company C" +
            " WHERE C.companyId = (SELECT U.companyId FROM Users U WHERE U.userId = :userId)) B";

        q.ninvoke(connection,"query", insertQuery, userEmailJSON).then(function(result){

            deferred.resolve(result);

        }).fail(function(err){
            deferred.reject(err);
        });

        return deferred.promise;
    };

    return securityServerService;
};