/**
 * Created by gal on 1/28/15.
 */
(function( ) {

    var eventModule = angular.module("EventModule");

    eventModule.service("eventService", ['$http','$log','config','_','alertService', function($http,$log,config,_,alertService) {

        var eventsList = {};

        function updateEvents(terminalId) {

            $http.get(config.getEventURL+"/"+terminalId).
                success(function(data, status, headers, config) {

                    $log.debug("Received Events:" + JSON.stringify(data));

                    if(data.message) {
                        $log.debug("Error getting events");
                        alertService.pushMessage(data);
                    }
                    else {
                        events = data;
                    }

                }).
                error(function(data, status, headers, config) {

                    alertService.pushMessage("Connection Error");
                });
        }

        function addNewEvent(newEvent) {

            var eventJSON = angular.copy(newEvent);

            $http.post(config.addEventURL, eventJSON).
                success(function(data, status, headers, config) {

                    $log.debug("Add Event Received Data:" + JSON.stringify(data));

                    if(data.message) {
                        alertService.pushMessage(data);
                    }
                    else {
                        $scope.events.push(data);
                        $('#eventModal').modal('hide');
                        $scope.newEvent = "";
                    }

                }).
                error(function(data, status, headers, config) {
                    alertService.pushMessage("Connection Error");
                });
        }

        function editEvent(newEvent) {

        }

        function deleteEvent(eventId) {

        }

    }]);

});