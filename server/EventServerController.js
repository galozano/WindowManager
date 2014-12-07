/**
 * Created by gal on 12/5/14.
 */

module.exports = function(express,connection,logger) {

    var eventsRouter = express.Router();

    function getEvents(result)
    {
        logger.debug("Obtaining Events");

        var query = "SELECT eventId,arrivingTime,day,duration,eventLength,eventName,eventStart FROM Events";
        logger.info(query);

        connection.query(query, function(err, rows) {
            if(err) {

                //TODO:Poner los codigos de los errores en las respuestas de los mensajes
                logger.error("ERROR:" + err);
                result({ message: 'There was an unexpected error'});
            }
            else {
                logger.info(rows);
                result(rows);
            }
        });
    }

    eventsRouter.get('/events', function (req, res) {

        var result = getEvents(function(result) {
            res.json(result);
        });
    });

    eventsRouter.post('/addEvent',function(req,res) {

        logger.debug("Add Event");
        logger.info(req.body);

        var newEvent = req.body;
        var insertedId = {eventId:-1};

        var insertQuery = "INSERT INTO Events (eventName,arrivingTime,duration,eventStart,eventLength,day) VALUES (:eventName,:arrivingTime,:duration,:eventStart,:eventLength,:day)";
        var selectQuery = "SELECT eventId,arrivingTime,day,duration,eventLength,eventName,eventStart FROM Events WHERE eventId = :eventId";

        connection.query(insertQuery, newEvent, function(err, result) {

            if(err) {
                //TODO:Poner los codigos de los errores en las respuestas de los mensajes
                console.log(err);
                res.json({ message: 'There was an unexpected error'});
            }
            else
            {
                logger.debug(result.insertId);
                logger.info(result);
                insertedId.eventId = result.insertId;

                connection.query(selectQuery,insertedId, function(err, result) {

                    if(err) {
                        //TODO:Poner los codigos de los errores en las respuestas de los mensajes
                        console.error(err);
                        res.json({ message: 'There was an unexpected error'});
                    }
                    else
                    {
                        console.log(result);
                        res.json(result[0]);
                    }
                });
            }
        });
    });

    eventsRouter.post('/editEvent', function(req,res) {

        logger.debug("Edit event");
        logger.info(req.body);

        var editEvent = req.body;

        var updateQuery = "UPDATE Events SET arrivingTime = :arrivingTime, day = :day, duration = :duration, eventLength = :eventLength, eventName = :eventName ,eventStart = :eventStart" +
            "  WHERE eventId = :eventId";

        connection.query(updateQuery, editEvent, function(err, result) {

            if(err) {
                //TODO:Poner los codigos de los errores en las respuestas de los mensajes
                logger.error(err);
                res.json({ message: 'There was an unexpected error'});
            }
            else {

                logger.info(result);
                res.json(result);
            }
        });
    });

    eventsRouter.post('/deleteEvent',function(req,res) {

        logger.debug("Delete event");
        logger.info(req.body);

        var deleteEvent = req.body;
        logger.info("Delete:" + deleteEvent);

        var deleteQuery = "DELETE FROM Events WHERE eventId = :eventId";

        connection.query(deleteQuery, deleteEvent, function(err, result) {

            if(err) {
                //TODO:Poner los codigos de los errores en las respuestas de los mensajes
                logger.error(err);
                res.json({ message: 'There was an unexpected error'});
            }
            else {

                logger.info(result);
                res.json(result);
            }
        });
    });

    return eventsRouter;
};
