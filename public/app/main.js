/**
 * Created by gal on 10/11/14.
 */

//TODO: Poner comentarios en todo lados

(function() {

    var app = angular.module("myAPP",["ngRoute","EventsController","EventsDirectives","TerminalController"]);

    app.constant('config',{
        getEventURL:'/events/getEvents',
        addEventURL:'/events/addEvent',
        editEventURL:'/events/editEvent',
        deleteEventURL:'/events/deleteEvent',
        getTerminalsURL:'/terminals/getTerminals',
        getTerminalURL:'/terminals/getTerminal'

    });

    app.config(function($logProvider){
        $logProvider.debugEnabled(true);
    });

    //--------------------------------------------------------------------
    // Routes
    //--------------------------------------------------------------------

    app.config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/events/:terminalId', {
            templateUrl: 'app/events/events.html',
            controller: 'EventController'
        }).when('/terminals',{
            templateUrl: 'app/terminals/terminals.html',
            controller: 'TerminalController'
        }).otherwise({
            redirectTo: '/terminals'
        });
    }]);

    //--------------------------------------------------------------------
    // Controllers
    //--------------------------------------------------------------------

    app.controller("AlertController", function($scope,$log){

        $scope.errorMessage = "";
        $scope.showError = false;

        $scope.$on('AlertEvent', function (event, message) {

            $log.log("AlertEvent Call");
            $log.log(message);

            $scope.showError = false;
            $scope.showError = true;
            $scope.errorMessage = message;
        });

    });

})();