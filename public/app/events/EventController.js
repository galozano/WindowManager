/**
 * Created by gal on 12/8/14.
 */
(function(){

    var eventModule = angular.module("EventModule");

    /**
     * Event Controller to handle all Events logic
     */
    eventModule.controller("EventController", ['$http','$log','$scope','$routeParams','config','$rootScope','_',
        function($http,$log,$scope,$routeParams,config,$rootScope,_) {

        //------------------------------------------------------------------------
        // Router Params
        //------------------------------------------------------------------------

        var terminalId = $routeParams.terminalId;
        $log.debug("TERMINAL ID:" + terminalId);

        //------------------------------------------------------------------------
        // Scope Variables
        //------------------------------------------------------------------------

        //All the events of the specific terminal selected
        $scope.events = [];

        //Information about the terminal being analyzed
        $scope.terminal = "";

        //General Hour and day information to create tables
        $scope.hours = ['1','2','3','4','5','6','7','8','9','10','11','12'];
        $scope.days = [{dayId:1,dayName:"Monday"},{dayId:2,dayName:"Tuesday"},{dayId:3,dayName:"Wednesday"},{dayId:4,dayName:"Thursday"},{dayId:5,dayName:"Friday"},{dayId:6,dayName:"Saturday"},{dayId:7,dayName:"Sunday"}];

        //Form Elements
        $scope.editable = false;
        $scope.newEvent = "";

        //Show current crane list of an specific event when selected
        $scope.cranesList = [];

        //------------------------------------------------------------------------
        // Initialization
        //------------------------------------------------------------------------

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

        function getTerminalInformation( ) {

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
            getTerminalInformation( );
        }

        //------------------------------------------------------------------------
        // Private Functions
        //------------------------------------------------------------------------


        //------------------------------------------------------------------------
        // Scope Functions
        //------------------------------------------------------------------------

        $scope.addNewEvent = function(newEvent) {

            $log.log("New Event");

            if ($scope.eventForm.$invalid) {
                $log.debug("Invalid Form");
                $scope.eventForm.showValidation = true;
                return;
            }

            var eventToAdd = angular.copy(newEvent);
            $log.debug("Event to Add:" + JSON.stringify(eventToAdd));

            var eventJSON = {
                "eventName":newEvent.eventName,
                "eventArrivingTime":newEvent.eventArrivingTime,
                "eventDuration":newEvent.eventDuration,
                "eventStart":newEvent.eventStart,
                "eventLength":newEvent.eventLength,
                "eventDay":newEvent.eventDay,
                "berthId":newEvent.berthId,
                "terminalId":terminalId
            };

            $http.post(config.addEventURL, eventJSON).
                success(function(data, status, headers, config) {

                    $log.log(data);

                    if(data.message) {
                        $log.error("Error adding events");

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

            $log.debug("Changing Form button");
            $scope.editable = false;
            $scope.eventForm.$setPristine();
            $scope.newEvent = "";

        };

        $scope.editEvent = function(newEvent) {

            $log.log("Edit Event");
            $log.log("Edited Event:" + JSON.stringify(newEvent));

            if ($scope.eventForm.$invalid) {
                $log.debug("Invalid Form");
                $scope.eventForm.showValidation = true;
                return;
            }

            var eventJSON = {
                "eventName":newEvent.eventName,
                "eventArrivingTime":newEvent.eventArrivingTime,
                "eventDuration":newEvent.eventDuration,
                "eventStart":newEvent.eventStart,
                "eventLength":newEvent.eventLength,
                "eventDay":newEvent.eventDay,
                "eventId":newEvent.eventId,
                "berthId":newEvent.berthId,
                "terminalId":terminalId
            };

            $http.post(config.editEventURL, eventJSON).
                success(function(data, status, headers, config) {

                    //TODO:Mostar un mensaje de que funciono en algun lado
                    $log.log("Received Edit Data:" + JSON.stringify(data));
                }).
                error(function(data, status, headers, config) {

                    //TODO:Manage the error and send a message to the scope
                    $log.log('Error');
                });

            if( $scope.eventChange)
                $scope.eventChange = false;
            else
                $scope.eventChange = true;

            $scope.newEvent = {};

        };

        $scope.editEventModal = function(event) {

            $log.log("Edit Event Modal");
            $log.log("Event to edit:" + JSON.stringify(event));

            $scope.newEvent = angular.copy(event);
            $scope.editable = true;
        };

        $scope.deleteEvent = function(event) {

            $log.log("Delete Event");
            $log.log(event);

            $http.post(config.deleteEventURL, {eventId:event.eventId}).
                success(function(data, status, headers, config) {

                    //TODO:Mostar un mensaje de que funciono en algun lado
                    $log.log("Received Delete Data:" + JSON.stringify(data));

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

            $log.debug("Move Event");
            $log.debug("Moved Event: " + JSON.stringify(newEvent));

            var eventJSON = {
                "eventName":newEvent.eventName,
                "eventArrivingTime":newEvent.eventArrivingTime,
                "eventDuration":newEvent.eventDuration,
                "eventStart":newEvent.eventStart,
                "eventLength":newEvent.eventLength,
                "eventDay":newEvent.eventDay,
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

        $scope.editCranesModal = function(event) {

            $log.debug("Edit Cranes Modal:" + JSON.stringify(event));

            var cranesIdEvents = [];
            var terminalCranes = $scope.terminal.cranes;
            var eventCranes = event.eventCranes;
            $scope.newEvent = event;

            var cranesList = [];

            for(var i = 0 ; i < eventCranes.length ; i++) {
                var eventCrane = eventCranes[i];
                cranesIdEvents.push(eventCrane.craneId);
            }

            $log.debug("Terminal Cranes:" + JSON.stringify(terminalCranes));

            for(var j = 0 ; j < terminalCranes.length ; j++) {
                var crane = terminalCranes[j];
                var value = false;

                if(_.contains(cranesIdEvents,crane.craneId)){
                    value = true;
                }

                var temp = {
                    craneId:crane.craneId,
                    craneName:crane.craneName,
                    value:value
                };

                cranesList.push(temp);
            }

            $log.debug("Crane Final List:" + JSON.stringify(cranesList))
            $scope.cranesList = cranesList;
        };

        $scope.editCranes = function(cranesList) {

            $log.debug("Edit Cranes:" + JSON.stringify(cranesList));
            var eventSelected = $scope.newEvent;
            var sendJSON = {
                eventId:eventSelected.eventId
            };

            var eventCranes = [];

            for(var i = 0; i < cranesList.length; i++) {
                var crane = cranesList[i];

                if(crane.value) {
                    eventCranes.push({craneId:crane.craneId});
                }
            }

            sendJSON.cranes = eventCranes;
            $log.debug("JSON to Send:" + JSON.stringify(sendJSON));

            var dataToSend = {json:JSON.stringify(sendJSON)};

            $http.post(config.editCranesURL, dataToSend).
                success(function(data, status, headers, config) {

                    $log.debug("Received Edit Crane Data:" + JSON.stringify(data));
                    $('#craneModal').modal('hide');

                }).
                error(function(data, status, headers, config) {

                    //TODO:Manage the error and send a message to the scope
                    $log.error('Error');
                });
        };
    }]);
})();