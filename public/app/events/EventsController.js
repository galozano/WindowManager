/**
 * Created by gal on 12/8/14.
 */
(function(){

    var eventControllerModule = angular.module("EventsController",[ ]);

    eventControllerModule.controller("EventController", function($http,$log,$scope,$routeParams,config,$rootScope) {

        var terminalId = $routeParams.terminalId;

        $log.log("TERMINAL ID:" + terminalId);

        $scope.editable = false;
        $scope.showError = false;

        $scope.errorMessage = "";
        $scope.formError = "";
        $scope.newEvent = "";
        $scope.events = [];

        $scope.hours = ['1','2','3','4','5','6','7','8','9','10','11','12'];
        $scope.days = [{dayId:1,dayName:"Monday"},{dayId:2,dayName:"Tuesday"},{dayId:3,dayName:"Wednesday"},{dayId:4,dayName:"Thursday"},{dayId:5,dayName:"Friday"},{dayId:6,dayName:"Saturday"},{dayId:7,dayName:"Sunday"}];
        $scope.terminal = "";
        $scope.mainBerths = "";

        init();

        function getEvents() {
            $http.get(config.getEventURL+"/"+terminalId).
                success(function(data, status, headers, config) {

                    $log.log("Received Events:" + JSON.stringify(data));

                    if(data.message) {
                        $log.log("Error getting events");
                        $rootScope.$broadcast('AlertEvent', data.message);
                    }
                    else
                        $scope.events = data;

                }).
                error(function(data, status, headers, config) {

                    $log.log('Error obtaining event');
                    $rootScope.$broadcast('AlertEvent', "Error obtaining events");
                });
        }

        function constructMainBerths(berths) {
            var berthsMainLength  = new Object();

            //Hago un array de los berths con start true y su longitude
            var sum = 0;
            var lastBerthId = "";

            for(var i = 0 ; i < berths.length ; i++) {

                var berth = berths[i];

                if(berth.berthStart) {
                    berthsMainLength[berth.berthId] = {sumLength: sum,berthName: berth.berthName, berthId:berth.berthId};
                }

                sum += berth.berthLength;
            }

            $scope.terminal.mainBerths = berthsMainLength;
            //$scope.mainBerths = berthsMainLength;
            //$log.log("Berths Main Length:" + JSON.stringify(berthsMainLength));
            $log.log("Modified Terminal:" + JSON.stringify($scope.terminal));
        }

        function createTerminalViewObject(data) {

            var totalBerthLength = data.totalLength;

            //TODO:Quitar esto de aqui
            var totalPixelLength = 999;

            for(var i = 0; i < data.berths.length ; i ++) {

                var berth = data.berths[i];
                berth.pixelLength = (totalPixelLength/totalBerthLength) * berth.berthLength;
            }

            console.log("New Terminal Data:" + JSON.stringify(data));
        }

        function getTerminalInformation(callback) {

            $http.get(config.getTerminalURL+"/"+terminalId).
                success(function(data, status, headers, config) {

                    $log.log("Terminal Info Received:" + JSON.stringify(data));

                    //Validate is message is an error
                    if(data.type) {
                        $log.log("Error getting events");
                        $rootScope.$broadcast('AlertEvent', data.message);
                    }
                    else {

                        createTerminalViewObject(data);
                        $scope.terminal = data;

                        if(data.berths) {
                            constructMainBerths(data.berths);
                            getEvents();
                        }
                        else
                            $rootScope.$broadcast('AlertEvent', "Unable to load events");
                    }
                }).
                error(function(data, status, headers, config) {

                    //TODO:Manage the error and send a message to the scope
                    $log.log('Error');
                });
        }

        function init() {
            getTerminalInformation(function(){



            });
        }

        $scope.addNewEvent = function(newEvent) {

            $log.log("New Event");

            if(!newEvent)
                $scope.formError = "No information to submit"
            else if(!newEvent.eventName || newEvent.eventName.length > 20)
                $scope.formError = "Event name is invalid";
            else if(!newEvent.arrivingTime  || !(/[0-9][0-9]:[0-9][0-9]/.test(newEvent.arrivingTime)) || newEvent.arrivingTime.length > 5)
                $scope.formError = "Please digit a valid time";
            else if(!newEvent.duration || !(/[0-9]+/.test(newEvent.duration)))
                $scope.formError = "Please digit a valid duration";
            else if(!newEvent.eventStart || !(/[0-9]+/.test(newEvent.eventStart)))
                $scope.formError = "Please digit a valid berth start";
            else if(!newEvent.eventLength || !(/[0-9]+/.test(newEvent.eventLength)))
                $scope.formError = "Please digit a valid length";
            else if(!newEvent.day || !(/[0-9]/.test(newEvent.day)))
                $scope.formError = "Invalid day";


            var eventJSON = {
                "eventName":newEvent.eventName,
                "arrivingTime":newEvent.arrivingTime,
                "duration":newEvent.duration,
                "eventStart":newEvent.eventStart,
                "eventLength":newEvent.eventLength,
                "day":newEvent.day,
                "berthId":newEvent.berthId,
                "terminalId":terminalId
            };

            $http.post(config.addEventURL, eventJSON).
                success(function(data, status, headers, config) {

                    $log.log(data);

                    if(data.message) {
                        $log.error("Error adding events");
                        $scope.formError = data.message;
                    }
                    else {
                        $scope.events.push(data);
                        $('#eventModal').modal('hide');
                    }

                }).
                error(function(data, status, headers, config) {

                    //TODO:Manage the error and send a message to the scope
                    $log.log('Error');
                });

            $scope.newEvent = "";
        };

        $scope.changeButton = function() {
            $scope.editable = false;
        };

        $scope.editEvent = function(newEvent) {

            $log.log("Edit Event");
            $log.log("New Event:" + JSON.stringify(newEvent));

            //TODO:Poner validaciones de lo que ingrese la gente en edicion

            var eventJSON = {
                "eventName":newEvent.eventName,
                "arrivingTime":newEvent.arrivingTime,
                "duration":newEvent.duration,
                "eventStart":newEvent.eventStart,
                "eventLength":newEvent.eventLength,
                "day":newEvent.day,
                "eventId":newEvent.eventId,
                "berthId":newEvent.berthId,
                "terminalId":terminalId
            };

            $http.post(config.editEventURL, eventJSON).
                success(function(data, status, headers, config) {

                    //TODO:Mostar un mensaje de que funciono en algun lado
                    $log.log(data);
                }).
                error(function(data, status, headers, config) {

                    //TODO:Manage the error and send a message to the scope
                    $log.log('Error');
                });

            if( $scope.eventChange)
                $scope.eventChange = false;
            else
                $scope.eventChange = true;

            $scope.newEvent = "";

        };

        $scope.editEventModal = function(event) {

            $log.log("Edit Event Modal");
            $log.log("Event to edit:" + JSON.stringify(event));

            //var tempEvent = angular.copy(event);
            $scope.newEvent = event;
            $scope.editable = true;
        };

        $scope.deleteEvent = function(event) {

            $log.log("Delete Event");
            $log.log(event);

            $http.post(config.deleteEventURL, {eventId:event.eventId}).
                success(function(data, status, headers, config) {

                    //TODO:Mostar un mensaje de que funciono en algun lado
                    $log.log(data);

                }).
                error(function(data, status, headers, config) {

                    //TODO:Manage the error and send a message to the scope
                    $log.log('Error');
                });

            init();
        };

        $scope.updateEvents = function() {

            $log.log("Update Events");
            getEvents();
        };

        $scope.moveEvent = function(newEvent) {

            $log.log("Move Event");
            $log.log("Moved Event: " + JSON.stringify(newEvent));

            var eventJSON =
            {
                "eventName":newEvent.eventName,
                "arrivingTime":newEvent.arrivingTime,
                "duration":newEvent.duration,
                "eventStart":newEvent.eventStart,
                "eventLength":newEvent.eventLength,
                "day":newEvent.day,
                "eventId":newEvent.eventId,
                "berthId":newEvent.berthId
            };

            $http.post(config.editEventURL, eventJSON).
                success(function(data, status, headers, config) {

                    $log.log("Received Edit Data:" + JSON.stringify(data));

                }).
                error(function(data, status, headers, config) {

                    //TODO:Manage the error and send a message to the scope
                    $log.log('Error');
                });
        };

    });
})();