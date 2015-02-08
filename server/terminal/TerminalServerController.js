/**
 * Created by gal on 12/6/14.
 */

module.exports = function(express,poolConnections,logger,configCSM,q,terminalService,utilitiesCommon) {

    var terminalsRouter = express.Router();

    /**
     *
     */
    terminalsRouter.get(configCSM.urls.terminals.getTerminals, function(req, res) {

        var user = req.authUser;
        var parameters = {
            rolId: user.rolId
        };

        var query2 = "SELECT T.terminalId, T.terminalName " +
            "FROM Terminals AS T INNER JOIN TerminalAccess AS TA ON TA.terminalId = T.terminalId " +
            "WHERE TA.rolId = :rolId;";

        poolConnections.getConnection(function(err, connection) {

            if (err) {
                logger.error("Pool Error:" + JSON.stringify(err));
                res.json(configCSM.errors.DATABASE_ERROR);
                connection.release();
            }
            else {
                connection.query(query2,parameters,function(err, result) {
                    if(err) {
                        logger.error("ERROR:" + err);
                        res.json(configCSM.errors.DATABASE_ERROR);
                    }
                    else {
                        logger.info("JSON Sent:" + JSON.stringify(result));
                        res.json(result);
                    }

                    connection.release();
                });
            }
        });
    });

    terminalsRouter.get(configCSM.urls.terminals.getTerminal+'/:terminalId', function(req,res) {

        logger.info("Terminal ID Requested:" + req.params.terminalId);

        if(req.params.terminalId && /[0-9]+/.test(req.params.terminalId)) {

            var terminalId = req.params.terminalId;
            var terminalIdJson = {terminalId:terminalId};

            poolConnections.getConnection(function(err, connection) {

                if (err) {
                    logger.error("Pool Error:" + JSON.stringify(err));
                    res.json(configCSM.errors.DATABASE_ERROR);
                    connection.release();
                }
                else {

                    terminalService.getTerminal(terminalIdJson,connection).then(function(result){

                        connection.release();
                        res.json(result);

                    }).fail(function(err){
                        res.json(err);
                        connection.release();
                    });
                }
            });
        }
        else {
            logger.warn("Got invalid terminal id");
            res.json(configCSM.errors.TERMINAL_INVALID_ID);
        }
    });

    /**
     *
     */
    terminalsRouter.post(configCSM.urls.terminals.createTerminalSchema, function (req,res) {

        logger.info("JSON received:" +JSON.stringify(req.body));

        if(req.body.data) {

            var terminalConfigJSON = JSON.parse(req.body.data);

            poolConnections.getConnection(function(err, connection) {

                if (err) {
                    logger.error("Pool Error:" + JSON.stringify(err));
                    res.json(utilitiesCommon.generateResponse(configCSM.errors.DATABASE_ERROR,configCSM.status.ERROR));
                    connection.release();
                }
                else {
                    terminalService.createTerminalConfig(terminalConfigJSON,connection).then(function(result){

                        connection.release();
                        res.json(utilitiesCommon.generateResponse(result,configCSM.status.OK));

                    }).fail(function(err){
                        connection.release();
                        if(err){
                            res.json(utilitiesCommon.generateResponse(err,configCSM.status.ERROR));
                        }
                    });
                }
            });
        }
        else {
            res.json(utilitiesCommon.generateResponse(configCSM.errors.INVALID_INPUT,configCSM.status.ERROR));
        }
    });

    /**
     * POST: Delete the terminal schema specified with the id
     */
    terminalsRouter.post(configCSM.urls.terminals.deleteTerminalSchema,function(req,res) {

        logger.info("JSON received:" +JSON.stringify(req.body));

        if(req.body.data) {

            var data = JSON.parse(req.body.data);

            poolConnections.getConnection(function(err, connection) {

                if (err) {
                    logger.error("Pool Error:" + JSON.stringify(err));
                    res.json(utilitiesCommon.generateResponse(configCSM.errors.DATABASE_ERROR,configCSM.status.ERROR));
                    connection.release();
                }
                else {
                    terminalService.deleteTerminalConfigSchema(data,connection).then(function(result){
                        connection.release();
                        res.json(utilitiesCommon.generateResponse([],configCSM.status.OK));

                    }).fail(function(err){
                        connection.release();
                        if(err){
                            res.json(utilitiesCommon.generateResponse(err,configCSM.status.ERROR));
                        }
                    });
                }
            });
        }
        else {
            res.json(utilitiesCommon.generateResponse(configCSM.errors.INVALID_INPUT,configCSM.status.ERROR));
        }
    });

    /**
     * POST: Create a new terminal
     */
    terminalsRouter.post(configCSM.urls.terminals.createTerminal, function(req, res){

        logger.info("JSON received:" + JSON.stringify(req.body));

        if(req.body.data) {

            var data = JSON.parse(req.body.data);

            poolConnections.getConnection(function(err, connection) {

                if (err) {
                    logger.error("Pool Error:" + JSON.stringify(err));
                    res.json(utilitiesCommon.generateResponse(configCSM.errors.DATABASE_ERROR, configCSM.status.ERROR));
                    connection.release();
                }
                else {
                    terminalService.createTerminal(data,connection).then(function(result){

                        connection.release();
                        res.json(utilitiesCommon.generateResponse(result,configCSM.status.OK))

                    }).fail(function(err){
                        connection.release();
                        if(err){
                            res.json(utilitiesCommon.generateResponse(err,configCSM.status.ERROR));
                        }
                    });
                }
            });
        }
        else {
            res.json(utilitiesCommon.generateResponse(configCSM.errors.INVALID_INPUT,configCSM.status.ERROR));
        }
    });

    terminalsRouter.post(configCSM.urls.terminals.deleteTerminal, function(req,res) {

        logger.info("JSON received:" +JSON.stringify(req.body));

        if(req.body.data) {

            var data = JSON.parse(req.body.data);
            logger.debug("Data received:" + JSON.stringify(data));

            poolConnections.getConnection(function(err, connection) {

                if (err) {
                    logger.error("Pool Error:" + JSON.stringify(err));
                    res.json(utilitiesCommon.generateResponse(configCSM.errors.DATABASE_ERROR,configCSM.status.ERROR));
                    connection.release();
                }
                else {
                    terminalService.deleteTerminal(data,connection).then(function(result){
                        connection.release();
                        res.json(utilitiesCommon.generateResponse(result,configCSM.status.OK));

                    }).fail(function(err){
                        connection.release();
                        if(err){
                            res.json(utilitiesCommon.generateResponse(err,configCSM.status.ERROR));
                        }
                    });
                }
            });
        }
        else {
            res.json(utilitiesCommon.generateResponse(configCSM.errors.INVALID_INPUT,configCSM.status.ERROR));
        }
    });


    terminalsRouter.get(configCSM.urls.terminals.getTerminalConfigSchemas, function(req,res){

        poolConnections.getConnection(function(err, connection) {

            if (err) {
                logger.error("Pool Error:" + JSON.stringify(err));
                res.json(utilitiesCommon.generateResponse(configCSM.errors.DATABASE_ERROR,configCSM.status.ERROR));
                connection.release();
            }
            else {
                terminalService.getTerminalConfigSchemas(connection).then(function(result){
                    connection.release();
                    res.json(utilitiesCommon.generateResponse(result,configCSM.status.OK));

                }).fail(function(err){
                    connection.release();
                    if(err){
                        res.json(utilitiesCommon.generateResponse(err,configCSM.status.ERROR));
                    }
                });
            }
        });
    });

    return terminalsRouter;
};