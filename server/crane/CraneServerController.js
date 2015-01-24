/**
 * Created by gal on 12/28/14.
 */
module.exports = function(express, poolConnections, logger, configCSM, q, eventServerService,craneServerService) {

    var cranesRouter = express.Router();

    function insertCranes(eventId, cranes,connection) {

        logger.debug("Insert All Cranes:" +JSON.stringify(cranes));

        var promiseList = [];
        var insertQuery = "INSERT INTO EventsCranes (eventId,craneId) VALUES (:eventId,:craneId)";

        for(var i = 0; i < cranes.length ; i++) {

            var crane = cranes[i];
            var eventCrane = {eventId:eventId,craneId:crane.craneId};

            promiseList.push(q.ninvoke(connection,"query",insertQuery,eventCrane));
        }

        return promiseList;
    }

    /**
    * Edit Event Cranes
    */
    cranesRouter.post(configCSM.urls.cranes.editCranes, function(req,res) {

        logger.debug("Edit Event Cranes");
        logger.info(req.body);

        var eventCranes = JSON.parse(req.body.json);
        logger.info("JSON received: " + JSON.stringify(eventCranes));

        var eventId = {eventId:eventCranes.eventId};
        var deleteQuery = "DELETE FROM EventsCranes WHERE eventId = :eventId";

        poolConnections.getConnection(function(err, connection) {

            if (err) {
                logger.error("Error:" + JSON.stringify(err));
                res.json(configCSM.errors.DATABASE_ERROR);
                return;
            }

            q.ninvoke(connection,"query",deleteQuery,eventId).then(function(result){

                logger.debug("Result Delete Query:"+ JSON.stringify(result));
                return insertCranes(eventCranes.eventId,eventCranes.cranes,connection);

            }).then(function(){

                logger.debug("Getting Specific Event");

                eventServerService.getSpecificEvent(eventCranes.eventId,connection,function(result){
                    logger.info("JSON sent:" + JSON.stringify(result));
                    res.json(result);
                    connection.release();
                });

            }).fail(function(err){
                if(err) {
                    logger.error("ERROR Edit Cranes:" + JSON.stringify(err));
                    res.json(configCSM.errors.DATABASE_ERROR);
                }
                else {
                    logger.error("Unknown Error:" + JSON.stringify(err));
                }
                connection.release();
            });
        });

    });

    cranesRouter.post(configCSM.urls.cranes.createCraneSchema, function(req,res){

        logger.debug("Create Crane Schema");
        logger.info("JSON Recieved:" + req.body.json);



        if(req.body.json) {

            var cranesJSON = JSON.parse(req.body.json);

            poolConnections.getConnection(function(err, connection) {

                if (err) {
                    logger.error("Error:" + JSON.stringify(err));
                    res.json(configCSM.errors.DATABASE_ERROR);
                    connection.release();
                    return;
                }

                craneServerService.createCraneConfigSchema(cranesJSON,connection).then(function (result){

                    connection.release();
                    logger.info("JSON SENT:" + JSON.stringify(result));
                    res.json(result);

                }).fail(function(err){

                    connection.release();
                    if(err){
                        res.json(err);
                    }

                });
            });
        }
        else {
            res.json(configCSM.errors.INVALID_INPUT);
        }
    });

    return cranesRouter;
};