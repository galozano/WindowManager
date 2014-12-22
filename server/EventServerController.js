/**
 * Created by gal on 12/5/14.
 */

module.exports = function(express,connection,logger,configCSM) {

    var eventsRouter = express.Router();

    function getSpecificEvent(eventId, callback) {
        logger.debug("Select specific event");

        var eventIdJSON = {eventId:eventId};
        var selectQuery = "SELECT eventId,arrivingTime,day,duration,eventLength,eventName,eventStart,berthId,terminalId FROM Events WHERE eventId = :eventId";

        connection.query(selectQuery,eventIdJSON, function(err, result) {

            if(err) {
                logger.error("ERROR Add Events:" + err);
                callback(configCSM.errors.DATABASE_ERROR);
            }
            else
            {
                if(result[0]) {
                    callback(result[0]);
                }
                else {
                    logger.error("ERROR Add Events Result has no 0");
                    callback(configCSM.errors.DATABASE_ERROR);
                }
            }
        });
    }

    function getEvents(terminalId, callback) {
        logger.debug("Obtaining Events");

        var terminalIdJSON = {terminalId:terminalId};

        var query = "SELECT eventId,arrivingTime,day,duration,eventLength,eventName,eventStart,berthId FROM Events WHERE terminalId = :terminalId";
        logger.info("Get Events Query: " + query);

        connection.query(query,terminalIdJSON,function(err, result) {
            if(err) {
                logger.error("ERROR GET EVENTS:"+ err);
                callback(configCSM.errors.DATABASE_ERROR);
            }
            else {
                callback(result);
            }
        });
    }

    /**
     * @Name: Get Events
     * @Descripcion: Returns all the events from an specific terminal
     * @Pre:
     * @Post:
     */
    eventsRouter.get(configCSM.urls.events.getEvents + '/:terminalId', function (req, res) {

        var terminalId = "";

        logger.info("Terminal Id Received:" + req.params.terminalId);

        if(req.params.terminalId && /[0-9]+/.test(req.params.terminalId)) {
            terminalId = req.params.terminalId;

            getEvents(terminalId,function(result) {
                logger.info("JSON sent:" + JSON.stringify(result));
                res.json(result);
            });
        }
        else {
             logger.warn("Got invalid terminal id");
             res.json(configCSM.errors.TERMINAL_INVALID_ID);
        }

    });

    eventsRouter.post(configCSM.urls.events.addEvent,function(req,res) {

        logger.debug("Add Event");
        logger.info("JSON received: " + JSON.stringify(req.body));

        //TODO:Falta hacer las respectivas validaciones
        var newEvent = req.body;

        var insertQuery = "INSERT INTO Events (eventName,arrivingTime,duration,eventStart,eventLength,day,berthId,terminalId) VALUES (:eventName,:arrivingTime,:duration,:eventStart,:eventLength,:day,:berthId,:terminalId)";

        connection.query(insertQuery, newEvent, function(err, result) {

            if(err) {
                logger.error(err);
                res.json(configCSM.errors.DATABASE_ERROR);
            }
            else
            {
                logger.debug("Inserted ID:" +result.insertId);
                logger.info("Result for ADD Event:" + JSON.stringify(result));

                getSpecificEvent(result.insertId, function(result){
                    logger.info("JSON sent:" + JSON.stringify(result));
                    res.json(result);
                });

            }
        });
    });

    eventsRouter.post(configCSM.urls.events.editEvent, function(req,res) {

        logger.debug("Edit event");
        logger.info("JSON received: " + JSON.stringify(req.body));

        var editEvent = req.body;

        var updateQuery = "UPDATE Events SET arrivingTime = :arrivingTime, day = :day, duration = :duration, eventLength = :eventLength, eventName = :eventName, eventStart = :eventStart, berthId = :berthId" +
            "  WHERE eventId = :eventId";

        connection.query(updateQuery, editEvent, function(err, result) {

            if(err) {
                logger.error("ERROR Edit Events:" + error);
                res.json(configCSM.errors.DATABASE_ERROR);
            }
            else {

                getSpecificEvent(editEvent.eventId, function(result){
                    logger.info("JSON sent:" + JSON.stringify(result));
                    res.json(result);
                });
            }
        });
    });

    eventsRouter.post(configCSM.urls.events.deleteEvent,function(req,res) {

        logger.debug("Delete event");
        logger.info("JSON received: " + JSON.stringify(req.body));

        var deleteEvent = req.body;
        logger.info("Delete:" + deleteEvent);

        var deleteQuery = "DELETE FROM Events WHERE eventId = :eventId";

        connection.query(deleteQuery, deleteEvent, function(err, result) {

            if(err) {
                logger.error(err);
                res.json(configCSM.errors.DATABASE_ERROR);
            }
            else {

                logger.info("JSON sent:" + JSON.stringify(result));
                res.json(result);
            }
        });
    });

    return eventsRouter;
};
