/**
 * Created by gal on 12/28/14.
 */
module.exports = function(express, poolConnections, logger, configCSM, q, eventServerService, craneServerService, utilitiesCommon) {

    var cranesRouter = express.Router();

    /**
    * Edit Event Cranes
    */
    cranesRouter.post(configCSM.urls.cranes.editCranes, function(req,res) {

        var eventCranes = JSON.parse(req.body.data);
        logger.info("Edit Event Cranes JSON received: " + JSON.stringify(eventCranes));

        poolConnections.getConnection(function(err, connection) {

            if (err) {
                logger.error("Error:" + JSON.stringify(err));
                res.json(configCSM.errors.DATABASE_ERROR);
                connection.release();
            }
            else {

                craneServerService.editCranes(eventCranes,connection).then(function(result){
                    connection.release();
                    res.json(result);
                }).fail(function(err){
                    connection.release();
                    res.json(configCSM.errors.DATABASE_ERROR);
                });
            }
        });
    });

    /**
     * Create Crane Schema
     */
    cranesRouter.post(configCSM.urls.cranes.createCraneSchema, function(req,res){

        logger.debug("Create Crane Schema");
        logger.info("JSON Received:" + JSON.stringify(req.body));

        if(req.body.data && req.authUser ) {

            var cranesJSON = JSON.parse(req.body.data);

            if(!cranesJSON.cranes.length > 0) {
                res.json(utilitiesCommon.generateResponse(configCSM.errors.INVALID_INPUT,configCSM.status.ERROR));
                return;
            }

            poolConnections.getConnection(function(err, connection) {

                if (err) {
                    logger.error("Error:" + JSON.stringify(err));
                    res.json(utilitiesCommon.generateResponse(configCSM.errors.DATABASE_ERROR,configCSM.status.ERROR));
                    connection.release();
                }
                else {
                    craneServerService.createCraneConfigSchema(cranesJSON,req.authUser,connection).then(function (result){

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
     *
     */
    cranesRouter.post(configCSM.urls.cranes.deleteCraneSchema, function(req,res){

        logger.debug("Delete Crane Schema");
        logger.info("JSON Received:" + JSON.stringify(req.body));

        if(req.body.data) {

            var cranesJSON = JSON.parse(req.body.data);

            poolConnections.getConnection(function(err, connection) {

                if (err) {
                    logger.error("Error:" + JSON.stringify(err));
                    res.json(utilitiesCommon.generateResponse(configCSM.errors.DATABASE_ERROR, configCSM.status.ERROR));
                    connection.release();
                }
                else {
                    craneServerService.deleteCraneConfigSchema(cranesJSON,connection).then(function (result){

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
     *
     */
    cranesRouter.get(configCSM.urls.cranes.getCranesSchemas, function(req, res){

        poolConnections.getConnection(function(err, connection) {

            if (err) {
                logger.error("Error:" + JSON.stringify(err));
                res.json(utilitiesCommon.generateResponse(configCSM.errors.DATABASE_ERROR, configCSM.status.ERROR));
                connection.release();
            }
            else {

                craneServerService.getCranesSchemasConfigs(req.authUser,connection).then(function(result) {

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

    return cranesRouter;
};