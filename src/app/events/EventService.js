/**
 * Created by gal on 1/28/15.
 */
(function() {

    var eventModule = angular.module("EventModule");

    /**
     * Handles all the connections of events and cranes with the server
     */
    eventModule.service("eventService", ['$http','$log','config','_','alertService','$q','errors', function($http,$log,config,_,alertService,$q,errors) {

        //------------------------------------------------------------------------
        // Variables
        //------------------------------------------------------------------------

        var eventsList = [];

        //------------------------------------------------------------------------
        // Private Functions
        //------------------------------------------------------------------------

        function replaceEvent(modifiedEvent) {

            eventsList.forEach(function(element, index){

                if(element.eventId == modifiedEvent.eventId){
                    eventsList[index] = modifiedEvent;
                }
            });
        }

        //------------------------------------------------------------------------
        // Public Functions
        //------------------------------------------------------------------------

        this.updateEvents = function updateEvents(terminalId) {

            var deferred = $q.defer();

            $http.get(config.getEventURL+"/"+terminalId).
                success(function(data, status, headers, config) {

                    $log.debug("Received Events:" + JSON.stringify(data));

                    if(data.message) {
                        $log.debug("Error getting events");
                        deferred.reject(data);
                    }
                    else {
                        eventsList = data;
                        deferred.resolve(eventsList);
                    }
                }).
                error(function(data, status, headers, config) {
                    deferred.reject(errors.connectionError);
                });

            return deferred.promise;
        };

        this.addNewEvent = function addNewEvent(newEvent) {

            var deferred = $q.defer();
            var eventJSON = angular.copy(newEvent);

            $http.post(config.addEventURL, eventJSON).
                success(function(data, status, headers, config) {

                    $log.debug("Add Event Received Data:" + JSON.stringify(data));

                    if(data.message) {
                        deferred.reject(data);
                    }
                    else {
                        eventsList.push(data);
                        deferred.resolve(eventsList);
                    }
                }).
                error(function(data, status, headers, config) {
                    deferred.reject(errors.connectionError);
                });

            return deferred.promise;
        };

        this.editEvent = function editEvent(editedEvent) {

            var deferred = $q.defer();
            var eventJSON = angular.copy(editedEvent);

            $http.post(config.editEventURL, eventJSON).
                success(function(data, status, headers, config) {

                    $log.debug("Received Edit Data:" + JSON.stringify(data));

                    if(data.message) {
                        deferred.reject(data);
                    }
                    else {
                        replaceEvent(data);
                        deferred.resolve(eventsList);
                    }
                }).
                error(function(data, status, headers, config) {
                    deferred.reject(errors.connectionError);
                });

            return deferred.promise;
        };

        this.deleteEvent = function deleteEvent(eventId) {

            var deferred = $q.defer();

            $http.post(config.deleteEventURL, {eventId:eventId}).
                success(function(data, status, headers, config) {

                    $log.debug("Received Delete Data:" + JSON.stringify(data));

                    if(data.message) {
                        deferred.reject(data);
                    }
                    else {
                        var eventIndex = -1;
                        eventsList.forEach(function(element,index){

                            if(element.eventId == eventId){
                                eventIndex = index;
                            }
                        });

                        eventsList.splice(eventIndex,1);
                        deferred.resolve(eventsList);
                    }
                }).
                error(function(data, status, headers, config) {
                    deferred.reject(errors.connectionError);
                });

            return deferred.promise;
        };

        this.editCranes = function editCranes(cranes) {

            var deferred = $q.defer();
            var dataToSend = {data:JSON.stringify(cranes)};

            $http.post(config.editCranesURL, dataToSend).
                success(function(data, status, headers, config) {

                    $log.debug("Received Edit Crane Data:" + JSON.stringify(data));
                    replaceEvent(data);
                    deferred.resolve(eventsList);
                }).
                error(function(data, status, headers, config) {
                    deferred.reject(errors.connectionError);
                });

            return deferred.promise;
        };
    }]);
})();