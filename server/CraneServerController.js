/**
 * Created by gal on 12/28/14.
 */
module.exports = function(express, connection, logger, configCSM, q, eventServerService) {

    var cranesRouter = express.Router();

    function insertCranes(eventId, cranes) {

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

        q.ninvoke(connection,"query",deleteQuery,eventId).then(function(result){

            logger.debug("Result Delete Query:"+ JSON.stringify(result));
            return insertCranes(eventCranes.eventId,eventCranes.cranes);

        }).then(function(){

            logger.debug("Getting Specific Event");

            eventServerService.getSpecificEvent(eventCranes.eventId,function(result){
                logger.info("JSON sent:" + JSON.stringify(result));
                res.json(result);
            });

        }).fail(function(err){
            if(err) {
                logger.error("ERROR Edit Cranes:" + JSON.stringify(err));
                res.json(configCSM.errors.DATABASE_ERROR);
            }
            else {
                logger.error("Unknown Error:" + JSON.stringify(err));
            }
        });

    });

    return cranesRouter;
};