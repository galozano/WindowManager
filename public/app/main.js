/**
 * Created by gal on 10/11/14.
 */

//TODO: Poner comentarios en todo lados

(function() {

    var app = angular.module("myAPP",["ngRoute","EventController","EventDirectives","TerminalController"]);

    app.constant('config',{
        getEventURL:'/events/getEvents',
        addEventURL:'/events/addEvent',
        editEventURL:'/events/editEvent',
        deleteEventURL:'/events/deleteEvent',
        getTerminalsURL:'/terminals/getTerminals',
        getTerminalURL:'/terminals/getTerminal',
        editCranesURL:'/cranes/editEventCranes'
    });



    //TODO:poner los textos de los Injectors
    app.config(function($logProvider){
        $logProvider.debugEnabled(true);
    });

    //--------------------------------------------------------------------
    // Factories
    //--------------------------------------------------------------------

    app.factory('_', function() {
        return window._; // assumes underscore has already been loaded on the page
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

    //TODO:poner los textos de los Injectors
    app.controller("AlertController", ['$scope', '$log', function($scope,$log){

        $scope.errorMessage = "";
        $scope.showError = false;

        $scope.$on('AlertEvent', function (event, message) {

            $log.log("AlertEvent Call");
            $log.log(message);

            $scope.showError = false;
            $scope.showError = true;
            $scope.errorMessage = message;
        });

    }]);

})();