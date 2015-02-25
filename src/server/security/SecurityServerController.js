/**
 * Created by gal on 1/25/15.
 */
module.exports = function(express,poolConnections,logger,configCSM,q, utilitiesCommon) {

    var securityRouter = express.Router();

    securityRouter.post(configCSM.urls.security.addTerminalAccess, function(req, res) {

        logger.debug("JSON received:" + JSON.stringify(req.body));

        var insertSQL = "INSERT INTO TerminalAccess (terminalId, rolId) VALUES (:terminalId, :rolId)";
        var selectSQL = "SELECT terminalId, rolId FROM TerminalAccess WHERE terminalId = :terminalId AND rolId = :rolId";

        if(req.body.data) {
            poolConnections.getConnection(function(err, connection) {

                if (err) {
                    logger.error("Pool Error:" + JSON.stringify(err));
                    res.json(utilitiesCommon.generateResponse(configCSM.erros.DATABASE_ERROR, configCSM.status.ERROR));
                    connection.release();
                }
                else {
                    var data = JSON.parse(req.body.data);

                    q.ninvoke(connection,"query", selectSQL, data).then(function(result){

                        logger.debug("Result Query 1:" + JSON.stringify(result));

                        if(result[0].length == 0)
                        {
                            q.ninvoke(connection,"query", insertSQL, data).then(function(result){

                                logger.debug("Query Result:" + JSON.stringify(result));
                                res.json(utilitiesCommon.generateResponse([],configCSM.status.OK));
                                connection.release();

                            }).fail(function(err){
                                connection.release();
                                res.json(utilitiesCommon.generateResponse(configCSM.erros.DATABASE_ERROR,configCSM.status.ERROR));
                            });
                        }
                        else {
                            connection.release();
                            res.json(utilitiesCommon.generateResponse(configCSM.errors.INPUT_EXITS,configCSM.status.ERROR));
                        }

                    }).fail(function(err){
                        connection.release();
                        res.json(utilitiesCommon.generateResponse(configCSM.erros.DATABASE_ERROR,configCSM.status.ERROR));
                    });
                }
            });
        }
        else {
            res.json(utilitiesCommon.generateResponse(configCSM.errors.INVALID_INPUT,configCSM.status.ERROR));
        }
    });

    return securityRouter;
};