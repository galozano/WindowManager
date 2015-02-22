/**
 * Created by gal on 12/8/14.
 */
(function(){

    var eventModule = angular.module("EventModule");

    /**
     * Event Controller to handle all Events logic
     */
    eventModule.controller("EventController", ['$http','$log','$scope','$routeParams','config','alertService','_','eventService','terminalService', function($http, $log, $scope, $routeParams, config, alertService, _, eventService, terminalService) {

        //------------------------------------------------------------------------
        // Router Params
        //------------------------------------------------------------------------

        /**
         * The Terminal id being visualized
         */
        var terminalId = $routeParams.terminalId;

        $log.debug("TERMINAL ID:" + terminalId);

        //------------------------------------------------------------------------
        // Scope Variables
        //------------------------------------------------------------------------

        /**
         * All the events of the specific terminal selected
         */
        $scope.events = [];

        /**
         *  Information about the terminal being analyzed
         */
        $scope.terminal = "";

        /**
         * General Hour and day information to create tables
         */
        $scope.hours = ['1','2','3','4','5','6','7','8','9','10','11','12'];

        /**
         * The days of the week to show in the event modal
         */
        $scope.days = [{dayId:1,dayName:"Monday"},{dayId:2,dayName:"Tuesday"},{dayId:3,dayName:"Wednesday"},{dayId:4,dayName:"Thursday"},{dayId:5,dayName:"Friday"},{dayId:6,dayName:"Saturday"},{dayId:7,dayName:"Sunday"}];

        /**
         * Handles the create event modal to show the edit or create button
         */
        $scope.editable = false;

        /**
         * The new event being create of edited
         */
        $scope.newEvent = "";

        /**
         *  Show current crane list of an specific event when selected
         */
        $scope.cranesList = [];

        /**
         * Waits for the calendar to be paint to show the events
         */
        $scope.calendarLoaded = false;

        /**
         * The event being visualized on the viewEvent modal
         */
        $scope.viewEvent = {};


        //------------------------------------------------------------------------
        // Initialization
        //------------------------------------------------------------------------

        init();

        /**
         * Looks fo  the events of the current terminal
         */
        function getEvents() {

            eventService.updateEvents(terminalId).then(function(result){

                updateEventList(result);
            },function(err){
                alertService.pushMessage(err);
            });
        }

        /**
         * Initialize the terminal page by loading the terminal and the events
         */
        function init( ) {

            terminalService.getTerminal(terminalId).then(function(result){

                $scope.terminal = result;
                //createTerminalViewObject($scope.terminal);
                getEvents();
                $scope.calendarLoaded = true;

            }, function(err){
                alertService.pushMessage(err);
            });
        }

        //------------------------------------------------------------------------
        // Private Functions
        //------------------------------------------------------------------------

        /**
         * Updates the events and handles events that are at the end of the week
         * @param pEventsList - the event lis
         */
        function updateEventList(pEventsList) {

            $log.debug("Event List: " + JSON.stringify(pEventsList));

            var eventsList = angular.copy(pEventsList);

            if($scope.terminal) {

                eventsList.forEach(function(element){

                    var arrivingTime = element.eventArrivingTime;
                    var duration = element.eventDuration;

                    var splitArray = arrivingTime.split(":");
                    var arrivingHour = parseInt(splitArray[0],10);
                    var arrivingSec = parseInt(splitArray[1],10);

                    var totalHours = (24 * (element.eventDay - 1)) + (arrivingHour + duration) + (arrivingSec/60);
                    var arrivingTimeHours = (24 * (element.eventDay - 1)) + (arrivingHour) + (arrivingSec/60);

                    $log.debug("Evento:" + JSON.stringify(element) + " Total Hours:" + totalHours);

                    if(arrivingTimeHours > 168) {
                        element.eventArrivingTime = "00:00";
                        element.eventDay = 1;
                        element.eventCalculatedDuration = element.eventDuration;
                    }
                    else if(totalHours > 168){
                        $log.debug("Mayo que 168:" + totalHours);

                        element.eventCalculatedDuration = element.eventDuration - (totalHours-168);
                        $log.debug("Evento Nuevo:" + JSON.stringify(element));

                        //Create the new event for the top of the calendar
                        var cutEvent = angular.copy(element);
                        cutEvent.eventArrivingTime = "00:00";
                        cutEvent.eventDay = 1;
                        cutEvent.eventCalculatedDuration = (totalHours-168);
                        cutEvent.isCutEvent = true;

                        eventsList.push(cutEvent);
                    }
                    else {
                        element.eventCalculatedDuration = element.eventDuration;
                    }

                    var eventProductivity = 0;
                    //Calculate Total Productivity

                    element.eventCranes.forEach(function(crane){
                        eventProductivity += crane.craneGrossProductivity * (crane.ecAssignedPercentage/100);
                    });

                    element.eventProductivity = eventProductivity;

                });
            }

            $log.debug("Event List Changed: " + JSON.stringify(eventsList));
            $scope.events = eventsList;
        }

        //------------------------------------------------------------------------
        // Scope Functions
        //------------------------------------------------------------------------

        $scope.addNewEvent = function(newEvent) {

            $log.debug("New Event:" + JSON.stringify(newEvent));

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
                "berthId":newEvent.berthId,
                "eventColor":newEvent.eventColor,
                "terminalId":terminalId
            };

            if(!$scope.editable){
                eventService.addNewEvent(eventJSON).then(function(result){
                    updateEventList(result);
                    $('#eventModal').modal('hide');
                    $scope.newEvent = "";

                },function(err){
                    alertService.pushMessage(err);
                });
            }
        };

        $scope.changeButton = function() {

            $log.debug("Changing Form button");
            $scope.editable = false;
            $scope.eventForm.$setPristine();
            $scope.newEvent = "";
        };

        $scope.editEvent = function(newEvent) {

            $log.debug("Edit Event:" + JSON.stringify(newEvent));

            if ($scope.eventForm.$invalid) {
                $log.debug("Form is Invalid");
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
                "eventColor":newEvent.eventColor,
                "terminalId":terminalId
            };

            if($scope.editable){
                eventService.editEvent(eventJSON).then(function(result){
                    updateEventList(result);
                }, function(err){
                    alertService.pushMessage(err);
                });

                if( $scope.eventChange)
                    $scope.eventChange = false;
                else
                    $scope.eventChange = true;

                $scope.newEvent = {};
            }
        };

        $scope.editEventModal = function(event) {

            $log.debug("Event to edit Modal:" + JSON.stringify(event));

            $scope.newEvent = angular.copy(event);
            $scope.editable = true;
        };

        $scope.deleteEvent = function(event) {

            $log.debug("Delete Event:" + JSON.stringify(event));

            eventService.deleteEvent(event.eventId).then(function(result){
                updateEventList(result);
            }, function(err) {
                alertService.pushMessage(err);
            });
        };

        $scope.updateEvents = function() {

            $log.debug("Update Events");
            getEvents();
        };

        $scope.moveEvent = function(newEvent) {

            $log.debug("Moved Event: " + JSON.stringify(newEvent));

            var eventJSON = {
                "eventName":newEvent.eventName,
                "eventArrivingTime":newEvent.eventArrivingTime,
                "eventDuration":newEvent.eventDuration,
                "eventStart":newEvent.eventStart,
                "eventLength":newEvent.eventLength,
                "eventDay":newEvent.eventDay,
                "eventId":newEvent.eventId,
                "berthId":newEvent.berthId,
                "eventColor":newEvent.eventColor
            };

            eventService.editEvent(eventJSON).then(function(result){
                //$scope.events = result;

                updateEventList(result);

            }, function(err){
                alertService.pushMessage(err);
            });
        };

        $scope.editCranesModal = function(event) {

            $log.debug("Edit Cranes Modal:" + JSON.stringify(event));

            var terminalCranes = $scope.terminal.cranes;
            var eventCranes = event.eventCranes;
            $scope.newEvent = event;

            var cranesList = [];

            $log.debug("Terminal Cranes:" + JSON.stringify(terminalCranes));

            for(var j = 0 ; j < terminalCranes.length ; j++) {
                var crane = terminalCranes[j];

                var temp = {
                    craneId:crane.craneId,
                    craneName:crane.craneName,
                    ecAssignedPercentage: 100,
                    craneGrossProductivity:crane.craneGrossProductivity,
                    value:false
                };

                for(var k = 0; k < eventCranes.length; k++){

                    var eventCrane = eventCranes[k];

                    if(eventCrane.craneId == crane.craneId){
                        temp.craneGrossProductivity = crane.craneGrossProductivity;
                        temp.ecAssignedPercentage = eventCrane.ecAssignedPercentage;
                        temp.value = true;
                    }

                }

                cranesList.push(temp);
            }

            $log.debug("Crane Final List:" + JSON.stringify(cranesList));
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
                    eventCranes.push({
                        craneId:crane.craneId,
                        ecAssignedPercentage:crane.ecAssignedPercentage
                    });
                }
            }

            sendJSON.cranes = eventCranes;
            $log.debug("JSON to Send:" + JSON.stringify(sendJSON));

            eventService.editCranes(sendJSON).then(function(result){
                updateEventList(result);
                $('#craneModal').modal('hide');
            }, function(err){
                alertService.pushMessage(err);
            });
        };

        $scope.viewEventModal = function(viewEvent){

            $log.debug("View Event:" + JSON.stringify(viewEvent));
            $scope.viewEvent = viewEvent;
        };

    }]);
})();