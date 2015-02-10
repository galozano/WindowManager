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

    securityServerService.createTerminalAccess = function createTerminalAccess(user,terminalId, connection) {

        logger.debug("Create Terminal Access by Email:" + JSON.stringify(user));

        var deferred = q.defer();

        var userEmailJSON = {
            userEmail:user.userEmail,
            terminalId:terminalId
        };

        var insertQuery = "INSERT INTO TerminalAccess (terminalId, rolId) SELECT B.* FROM (" +
            " SELECT :terminalId terminalId,C.rolId FROM Company C" +
            " WHERE C.companyId = (SELECT U.companyId FROM Users U WHERE U.userEmail = :userEmail) UNION" +
            " SELECT :terminalId terminalId,U2.rolId FROM Users U2" +
            " WHERE U2.userEmail = :userEmail) B";

        q.ninvoke(connection,"query", insertQuery, userEmailJSON).then(function(result){

            deferred.resolve();

        }).fail(function(err){
            deferred.reject(err);
        });

        return deferred.promise;
    };

    return securityServerService;

};