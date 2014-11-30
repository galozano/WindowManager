/**
 * Created by gal on 10/11/14.
 */


(function() {

    var app = angular.module("myAPP",["eventsDirectives"]);

    //--------------------------------------------------------------------
    // Routes
    //--------------------------------------------------------------------


    //--------------------------------------------------------------------
    // Controllers
    //--------------------------------------------------------------------

    app.controller("EventController", function($http,$log,$scope) {

        $scope.editable = false;
        init();

        function init() {

            $http.get('/events').
                success(function(data, status, headers, config) {

                    $log.log(data);
                    $scope.events = data;
                }).
                error(function(data, status, headers, config) {

                    $log.log('Error');
                });
        }

        $scope.addNewEvent = function(newEvent) {

            $log.log("New Event");

            var eventJSON =
            {
                "eventName":newEvent.eventName,
                "arrivingTime":newEvent.arrivingTime,
                "duration":newEvent.duration,
                "eventStart":newEvent.eventStart,
                "eventLength":newEvent.eventLength,
                "day":newEvent.day
            };

            $http.post('/addEvent', eventJSON).
                success(function(data, status, headers, config) {

                    $log.log(data);
                    $scope.events.push(data);

                }).
                error(function(data, status, headers, config) {

                    $log.log('Error');
                });

            $scope.newEvent = "";
        };

        $scope.changeButton = function() {
            $scope.editable = false;
        }

        $scope.editEvent = function(newEvent) {

            $log.log("Edit Event");
            $log.log(newEvent);

            var eventJSON = {
                "eventName":newEvent.eventName,
                "arrivingTime":newEvent.arrivingTime,
                "duration":newEvent.duration,
                "eventStart":newEvent.eventStart,
                "eventLength":newEvent.eventLength,
                "day":newEvent.day,
                "eventId":newEvent.eventId
            };

            $http.post('/editEvent', eventJSON).
                success(function(data, status, headers, config) {

                    $log.log(data);
                }).
                error(function(data, status, headers, config) {

                    $log.log('Error');
                });

            if( $scope.eventChange)
                $scope.eventChange = false;
            else
                $scope.eventChange = true;

            $scope.newEvent = "";

        }

        $scope.editEventModal = function(event) {

            $log.log("Edit Event");
            console.log(event);

            //var tempEvent = angular.copy(event);

            $scope.newEvent = event;
            $scope.editable = true;
        };

        $scope.deleteEvent = function(event) {

            $log.log("Delete Event");
            $log.log(event);

            $http.post('/deleteEvent', {eventId:event.eventId}).
                success(function(data, status, headers, config) {

                    $log.log(data);

                }).
                error(function(data, status, headers, config) {

                    $log.log('Error');
                });

            init();
        };

        $scope.updateEvents = function() {

            $log.log("Update Events");
            init();
        };

        $scope.moveEvent = function(newEvent) {

            $log.log("Move Event");
            $log.log(newEvent);

            var eventJSON =
            {
                "eventName":newEvent.eventName,
                "arrivingTime":newEvent.arrivingTime,
                "duration":newEvent.duration,
                "eventStart":newEvent.eventStart,
                "eventLength":newEvent.eventLength,
                "day":newEvent.day,
                "eventId":newEvent.eventId
            };

            $http.post('/editEvent', eventJSON).
                success(function(data, status, headers, config) {

                    $log.log(data);

                }).
                error(function(data, status, headers, config) {

                    $log.log('Error');
                });
        };

    });

    app.directive('tableGen', function( ) {
        return {
            restrict: 'E',
            templateUrl: './app/table.html',
            replace: true
        }
    });

})();