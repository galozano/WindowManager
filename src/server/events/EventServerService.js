/**
 * Created by gal on 12/25/14.
 */
module.exports = function (poolConnections, logger, configCSM, q) {

    //---------------------------------------------------------------------------------
    // Variables
    //---------------------------------------------------------------------------------

    var eventServerService = {};

    //---------------------------------------------------------------------------------
    // Private Methods
    //---------------------------------------------------------------------------------

    function fillEventsWithCranes(rawEvents,connection) {

        logger.debug("Raw Events 1:" + JSON.stringify(rawEvents));

        var eventList = [];
        var promisesList = [];
        var queryCranes = "SELECT C.craneId,C.craneName,C.craneGrossProductivity,EC.ecAssignedPercentage FROM EventsCranes EC INNER JOIN Cranes C ON C.craneId = EC.craneId WHERE EC.eventId = :eventId";

        for(var i = 0; i < rawEvents.length ; i++) {

            var event = rawEvents[i];

            var eventPush = (function(e){
                var deferred = q.defer();
                var eventIdJSON = {eventId:e.eventId};
                logger.debug("Getting cranes of event:" + e.eventId);

                connection.query(queryCranes, eventIdJSON, function (err, result) {

                    if (err) {
                        logger.error("ERROR FILL EVENTS:" + JSON.stringify(err));
                        deferred.reject(configCSM.errors.DATABASE_ERROR);
                    }
                    else {
                        e.eventCranes = result;
                        eventList.push(e);
                        deferred.resolve(e);
                    }
                });

                return deferred.promise;
            })(event);

            promisesList.push(eventPush);
        }

        return promisesList;
    }

    //---------------------------------------------------------------------------------
    // Public Methods
    //---------------------------------------------------------------------------------

    eventServerService.getSpecificEvent = function getSpecificEvent(eventId,connection,callback) {
        logger.debug("Select specific event:" + JSON.stringify(eventId));

        var eventIdJSON = {eventId: eventId};

        var selectEventQuery = "SELECT eventId,eventArrivingTime,eventDay,eventDuration,eventLength,eventName,eventColor,eventStart,berthId,terminalId FROM Events WHERE eventId = :eventId";
        var selectEventsCrane = "SELECT C.craneId,C.craneName,C.craneGrossProductivity,EC.ecAssignedPercentage FROM EventsCranes EC INNER JOIN Cranes C ON C.craneId = EC.craneId WHERE EC.eventId = :eventId";
        var resultEvent = {};

        q.ninvoke(connection,"query",selectEventQuery,eventIdJSON).then(function(result){

            logger.debug("Select Event Result:" + JSON.stringify(result));

            if (result[0][0]) {
                resultEvent = result[0][0];
                return q.ninvoke(connection,"query",selectEventsCrane,eventIdJSON);
            }
            else {
                logger.debug("ERROR Add Events Result has no 0");
                callback(configCSM.errors.EVENT_INVALID_ID)
            }

        }).then(function(result){

            logger.debug("Select Cranes Result:" + JSON.stringify(result));
            if (result[0]) {
                resultEvent.eventCranes = result[0];
                callback(resultEvent);
            }
            else {
                logger.error("ERROR Add Events Result has no 0");
                callback(configCSM.errors.DATABASE_ERROR)
            }

        }).fail(function(err){
            logger.error("ERROR Select Event:" + JSON.stringify(err));
            callback(configCSM.errors.DATABASE_ERROR);
        });
    };

    eventServerService.getEvents = function getEvents(terminalId,user,connection, callback) {
        logger.debug("Obtaining Events:" + terminalId);

        var terminalIdJSON = {
            terminalId: terminalId,
            userId:user.userId
        };

        var eventsQuery = "SELECT eventId,eventArrivingTime,eventDay,eventDuration,eventLength,eventName,eventColor,eventStart,berthId " +
            "FROM Events WHERE terminalId = (SELECT terminalId FROM TerminalAccess WHERE terminalId = :terminalId " +
            "AND rolId = (SELECT rolId FROM Company C WHERE C.companyId = (SELECT U.companyId FROM Users U WHERE U.userId = :userId)))";

        logger.debug("Get Events Query: " + eventsQuery);

        connection.query(eventsQuery, terminalIdJSON, function (err, result) {

            if (err) {
                logger.error("ERROR Get Events:" + JSON.stringify(err));
                callback(configCSM.errors.DATABASE_ERROR);
            }
            else {
                logger.debug("Query Result:" + JSON.stringify(result));

                q.all(fillEventsWithCranes(result,connection)).then(function(eventList){
                    logger.debug("FILL CRANES:"+ JSON.stringify(eventList));
                    callback(eventList);

                }).fail(function(err){
                    logger.error("ERROR Get Events:" + JSON.stringify(err));
                    callback(configCSM.errors.DATABASE_ERROR);
                });
            }
        });
    };

    return eventServerService;
};