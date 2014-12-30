/**
 * Created by gal on 12/25/14.
 */
module.exports = function (connection, logger, configCSM, q) {

    //---------------------------------------------------------------------------------
    // Variables
    //---------------------------------------------------------------------------------

    var eventServerService = {};

    //---------------------------------------------------------------------------------
    // Private Methods
    //---------------------------------------------------------------------------------

    function fillEventsWithCranes(rawEvents) {

        logger.debug("Raw Events 1:" + JSON.stringify(rawEvents));

        var eventList = [];
        var promisesList = [];
        var queryCranes = "SELECT C.craneId,C.craneName FROM EventsCranes EC INNER JOIN Cranes C ON C.craneId = EC.craneId WHERE EC.eventId = :eventId";

        for(var i = 0; i < rawEvents.length ; i++) {

            var event = rawEvents[i];

            var eventPush = (function(e){
                var deferred = q.defer();
                var eventIdJSON = {eventId:e.eventId};
                logger.info("Getting cranes of event:" + e.eventId);

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

    eventServerService.getSpecificEvent = function getSpecificEvent(eventId, callback) {
        logger.debug("Select specific event");

        var eventIdJSON = {eventId: eventId};

        var selectEventQuery = "SELECT eventId,eventArrivingTime,eventDay,eventDuration,eventLength,eventName,eventStart,berthId,terminalId FROM Events WHERE eventId = :eventId";
        var selectEventsCrane = "SELECT C.craneId,C.craneName FROM EventsCranes EC INNER JOIN Cranes C ON C.craneId = EC.craneId WHERE EC.eventId = :eventId";
        var resultEvent = {};

        q.ninvoke(connection,"query",selectEventQuery,eventIdJSON).then(function(result){

            logger.debug("Select Event Result:" + JSON.stringify(result));

            if (result[0][0]) {
                resultEvent = result[0][0];
                return q.ninvoke(connection,"query",selectEventsCrane,eventIdJSON);
            }
            else {
                logger.error("ERROR Add Events Result has no 0");
                throw new Error(configCSM.errors.DATABASE_ERROR)
            }
        }).then(function(result){

            logger.debug("Select Cranes Result:" + JSON.stringify(result));
            if (result[0]) {
                resultEvent.eventCranes = result[0];
                callback(resultEvent);
            }
            else {
                logger.error("ERROR Add Events Result has no 0");
                throw new Error(configCSM.errors.DATABASE_ERROR)
            }
        }).fail(function(err){
            logger.error("ERROR Select Event:" + JSON.stringify(err));
            callback(configCSM.errors.DATABASE_ERROR);
        });
    };

    eventServerService.getEvents = function getEvents(terminalId, callback) {
        logger.debug("Obtaining Events");

        var terminalIdJSON = {terminalId: terminalId};
        var eventsQuery = "SELECT eventId,eventArrivingTime,eventDay,eventDuration,eventLength,eventName,eventStart,berthId FROM Events WHERE terminalId = :terminalId";

        logger.debug("Get Events Query: " + eventsQuery);


        connection.query(eventsQuery, terminalIdJSON, function (err, result) {

            if (err) {
                logger.error("ERROR Get Events:" + JSON.stringify(err));
                callback(configCSM.errors.DATABASE_ERROR);
            }
            else {
                logger.debug("Query Result:" + JSON.stringify(result));

                q.all(fillEventsWithCranes(result)).then(function(eventList){
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

//(function( ) {
//
//    var eventServerService = function(connection,logger,configCSM) {
//
//        this.connection = connection;
//        this.logger = logger;
//        this.configCSM = configCSM;
//
//    };
//
//    eventServerService.prototype.getSpecificEvent = function getSpecificEvent(eventId, callback) {
//        this.logger.debug("Select specific event");
//
//        var eventIdJSON = {eventId:eventId};
//        var selectQuery = "SELECT eventId,arrivingTime,day,duration,eventLength,eventName,eventStart,berthId,terminalId FROM Events WHERE eventId = :eventId";
//
//        this.connection.query(selectQuery,eventIdJSON, function(err, result) {
//
//            if(err) {
//                this.logger.error("ERROR Add Events:" + err);
//                callback(this.configCSM.errors.DATABASE_ERROR);
//            }
//            else
//            {
//                if(result[0]) {
//                    callback(result[0]);
//                }
//                else {
//                    this.logger.error("ERROR Add Events Result has no 0");
//                    callback(this.configCSM.errors.DATABASE_ERROR);
//                }
//            }
//        });
//    };
//
//    eventServerService.prototype.getEvents = function getEvents(terminalId, callback) {
//
//        var self = this;
//        self.logger.debug("Obtaining Events");
//
//        var terminalIdJSON = {terminalId:terminalId};
//
//        var queryEvents = "SELECT eventId,arrivingTime,day,duration,eventLength,eventName,eventStart,berthId FROM Events WHERE terminalId = :terminalId";
//        var queryCranes = "SELECT C.craneId,C.craneName FROM EventsCranes EC INNER JOIN Cranes C ON C.craneId = EC.craneId WHERE EC.eventId = :eventId";
//
//        self.connection.query(queryEvents,terminalIdJSON,function(err, result) {
//            if(err) {
//                self.logger.error("ERROR GET EVENTS:"+ err);
//                callback(this.configCSM.errors.DATABASE_ERROR);
//            }
//            else {
//
//                var rawEvents = result;
//                var eventsList = [];
//
//                for(var i = 0; i < rawEvents.length ; i++) {
//
//                    var event = rawEvents[i];
//
//                    var eventIdJSON = {eventId:event.eventId};
//
//                    self.logger.info("Getting cranes of event:" + event.eventId);
//
//                    self.connection.query(queryCranes,eventIdJSON,function(err, result) {
//
//                        if(err) {
//                            self.logger.error("ERROR GET EVENTS:"+ err);
//                            callback(self.configCSM.errors.DATABASE_ERROR);
//                        }
//                        else{
//                            event.cranes = result;
//                            eventsList.push(event);
//                        }
//                    });
//                }
//
//                self.logger.info("Return Get Events:" + JSON.stringify(eventsList));
//                callback(eventsList);
//            }
//        });
//    }
//
//    module.exports = function(connection,logger,configCSM){
//        return new eventServerService(connection,logger,configCSM);
//    };
//})();
