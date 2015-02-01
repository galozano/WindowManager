/**
 * Created by gal on 12/8/14.
 */
(function(){

    var eventModule = angular.module("EventModule");

    /**
     * Event Controller to handle all Events logic
     */
    eventModule.controller("EventController", ['$http','$log','$scope','$routeParams','config','alertService','_','eventService','terminalService',
        function($http, $log, $scope, $routeParams, config, alertService, _, eventService, terminalService) {

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
        $scope.calendarLoaded = false;

        //------------------------------------------------------------------------
        // Initialization
        //------------------------------------------------------------------------

        init();

        function getEvents() {

            eventService.updateEvents(terminalId).then(function(result){
                $scope.events = result;
            },function(err){
                alertService.pushMessage(err);
            });
        }

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
                "terminalId":terminalId
            };

            eventService.addNewEvent(eventJSON).then(function(result){
                $scope.events = result;
                $('#eventModal').modal('hide');
                $scope.newEvent = "";
            },function(err){
                alertService.pushMessage(err);
            });
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
                "terminalId":terminalId
            };

            eventService.editEvent(eventJSON).then(function(result){
                $scope.events = result;
            }, function(err){
                alertService.pushMessage(err);
            });

            if( $scope.eventChange)
                $scope.eventChange = false;
            else
                $scope.eventChange = true;

            $scope.newEvent = {};
        };

        $scope.editEventModal = function(event) {

            $log.debug("Event to edit Modal:" + JSON.stringify(event));

            $scope.newEvent = angular.copy(event);
            $scope.editable = true;
        };

        $scope.deleteEvent = function(event) {

            $log.debug("Delete Event:" + JSON.stringify(event));

            eventService.deleteEvent(event.eventId).then(function(result){
                $scope.events = result;
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
                "berthId":newEvent.berthId
            };

            eventService.editEvent(eventJSON).then(function(result){
                $scope.events = result;
            }, function(err){
                alertService.pushMessage(err);
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
                    eventCranes.push({craneId:crane.craneId});
                }
            }

            sendJSON.cranes = eventCranes;
            $log.debug("JSON to Send:" + JSON.stringify(sendJSON));

            eventService.editCranes(sendJSON).then(function(result){
                $scope.events = result;
                $('#craneModal').modal('hide');
            }, function(err){
                alertService.pushMessage(err);
            });
        };
    }]);
})();