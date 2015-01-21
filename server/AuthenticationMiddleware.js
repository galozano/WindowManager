/**
 * Created by gal on 1/10/15.
 */
module.exports = function(express, poolConnections, configCSM,logger, q) {

    //---------------------------------------------------------------------------------
    // Variables
    //---------------------------------------------------------------------------------

    var middlewareAuthentication = {};

    //---------------------------------------------------------------------------------
    // Private Methods
    //---------------------------------------------------------------------------------

    function verifyUserToken(userToken) {
        var deferred = q.defer();

        var query = "SELECT userId,userEmail,rolId FROM Users WHERE userToken = :userToken";

        var tokenJSON = {
           userToken: userToken
        };

        poolConnections.getConnection(function(err, connection) {

            if (err) {
                logger.error("Error:" + JSON.stringify(err));
                res.json(configCSM.errors.DATABASE_ERROR);
                return;
            }

            connection.query(query, tokenJSON, function (err, result) {

                if (err) {
                    logger.error("Error user token:" + JSON.stringify(err));
                    deferred.reject(configCSM.errors.DATABASE_ERROR);
                }
                else {
                    logger.debug("Query Result User Token:" + JSON.stringify(result));
                    deferred.resolve(result);
                }

                connection.release();
            });
        });

        return deferred.promise;
    }

    //---------------------------------------------------------------------------------
    // Public Methods
    //---------------------------------------------------------------------------------

    middlewareAuthentication.ensureAuthorized = function ensureAuthorized(req, res, next) {
        var bearerToken;
        var bearerHeader = req.headers["authorization"];

        logger.debug("Getting Token:" + JSON.stringify(bearerHeader));

        if (typeof bearerHeader !== 'undefined') {
            var bearer = bearerHeader.split(" ");
            bearerToken = bearer[1];

            logger.debug("Token Received:" + JSON.stringify(bearerToken));

            //Verify user token
            verifyUserToken(bearerToken).then(function(result){

                if(result && result.length > 0 && result[0]){
                    req.authUser = result[0];
                    logger.debug("Auth User:" + JSON.stringify(req.authUser));
                    next();
                }
                else
                    res.sendStatus(403);

            }).fail(function(err){
                //Sen error message
                res.json(err);
            });

        } else {
            //Sen error message
            res.sendStatus(403);
        }
    }

    return middlewareAuthentication;

};