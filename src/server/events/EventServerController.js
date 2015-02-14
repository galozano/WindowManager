/**
 * Created by gal on 12/5/14.
 */
module.exports = function(express,poolConnections,logger,configCSM,eventServerService,q) {

    var eventsRouter = express.Router();

    /**
     * @Name: Get Events
     * @Descripcion: Returns all the events from an specific terminal
     */
    eventsRouter.get(configCSM.urls.events.getEvents + '/:terminalId', function (req, res) {

        var terminalId = "";

        logger.info("Terminal Id Received:" + req.params.terminalId);

        if(req.params.terminalId && /[0-9]+/.test(req.params.terminalId)) {
            terminalId = req.params.terminalId;

            poolConnections.getConnection(function(err, connection) {

                if (err) {
                    logger.error("Error:" + JSON.stringify(err));
                    res.json(configCSM.errors.DATABASE_ERROR);
                    connection.release();
                }
                else {
                    eventServerService.getEvents(terminalId,req.authUser.rolId,connection,function(result) {
                        logger.info("JSON sent:" + JSON.stringify(result));
                        res.json(result);
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
    eventsRouter.post(configCSM.urls.events.addEvent,function(req,res) {

        logger.info("Add Event JSON received: " + JSON.stringify(req.body));

        //TODO:Falta hacer las respectivas validaciones
        var newEvent = req.body;

        var insertQuery = "INSERT INTO Events (eventName,eventArrivingTime,eventDuration,eventStart,eventLength,eventDay,berthId,terminalId) VALUES (:eventName,:eventArrivingTime,:eventDuration,:eventStart,:eventLength,:eventDay,:berthId,:terminalId)";

        poolConnections.getConnection(function(err, connection) {

            if (err) {
                logger.error("Error:" + JSON.stringify(err));
                res.json(configCSM.errors.DATABASE_ERROR);
                connection.release();
            }
            else {
                connection.query(insertQuery, newEvent, function(err, result) {

                    if(err) {
                        logger.error("ERROR Add Events:" + JSON.stringify(err));
                        res.json(configCSM.errors.DATABASE_ERROR);
                        connection.release();
                    }
                    else
                    {
                        logger.debug("Inserted ID:" +result.insertId);
                        logger.debug("Result for ADD Event:" + JSON.stringify(result));

                        eventServerService.getSpecificEvent(result.insertId,connection, function(result){
                            logger.info("JSON sent:" + JSON.stringify(result));
                            res.json(result);

                            connection.release();
                        });
                    }
                });
            }
        });

    });

    /**
     *
     */
    eventsRouter.post(configCSM.urls.events.editEvent, function(req,res) {

        logger.info("Edit event JSON received: " + JSON.stringify(req.body));

        var editEvent = req.body;

        var updateQuery = "UPDATE Events SET eventArrivingTime = :eventArrivingTime, eventDay = :eventDay, eventDuration = :eventDuration, eventLength = :eventLength, eventName = :eventName, eventStart = :eventStart, berthId = :berthId" +
            "  WHERE eventId = :eventId";

        poolConnections.getConnection(function(err, connection) {

            if (err) {
                logger.error("Error:" + JSON.stringify(err));
                res.json(configCSM.errors.DATABASE_ERROR);
                connection.release();
            }
            else {
                connection.query(updateQuery, editEvent, function(err, result) {

                    if(err) {
                        logger.error("ERROR Edit Events:" + JSON.stringify(err));
                        res.json(configCSM.errors.DATABASE_ERROR);
                        connection.release();
                    }
                    else {

                        eventServerService.getSpecificEvent(editEvent.eventId,connection,function(result){
                            logger.info("JSON sent:" + JSON.stringify(result));
                            res.json(result);
                            connection.release();
                        });
                    }
                });
            }
        });

    });

    /**
     *
     */
    eventsRouter.post(configCSM.urls.events.deleteEvent,function(req,res) {

        logger.debug("Delete event");
        logger.info("JSON received: " + JSON.stringify(req.body));

        var deleteEvent = req.body;

        var deleteEventJSON = {
            eventId: deleteEvent.eventId
        };

        logger.debug("Delete:" + JSON.stringify(deleteEvent));

        var deleteEventQuery = "DELETE FROM Events WHERE eventId = :eventId";
        var deleteEventsCranesQuery = "DELETE FROM EventsCranes WHERE eventId = :eventId";

        poolConnections.getConnection(function(err, connection) {

            if (err) {
                logger.error("Error:" + JSON.stringify(err));
                res.json(configCSM.errors.DATABASE_ERROR);
                connection.release();
            }
            else {
                connection.beginTransaction(function(err){

                    if(err) {
                        logger.error("Error:" + JSON.stringify(err));
                        res.json(configCSM.errors.DATABASE_ERROR);
                        connection.release();
                        return;
                    }

                    q.ninvoke(connection,"query",deleteEventsCranesQuery,deleteEventJSON).then(function(result){

                        return q.ninvoke(connection,"query",deleteEventQuery,deleteEventJSON)

                    }).then(function(result){

                        connection.commit(function(err) {
                            if (err) {
                                connection.rollback(function() {
                                    logger.error("Error:" + JSON.stringify(err));
                                    res.json(configCSM.errors.DATABASE_ERROR);
                                });
                            }
                            else {
                                logger.info("Query Result:" + JSON.stringify(result));
                                logger.info("JSON Sent:" + JSON.stringify("Ok"));
                                res.json("OK");
                            }

                            connection.release();
                        });

                    }).fail(function(err){
                        connection.rollback(function() {
                            connection.release();
                        });

                        logger.error("Error Delete Events:" + JSON.stringify(err));
                        res.json(configCSM.errors.DATABASE_ERROR);
                    });

                });
            }
        });
    });



    return eventsRouter;
};
