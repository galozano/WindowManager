/**
 * Created by gal on 12/15/14.
 */


(function(){

    var terminalsControllerModule = angular.module("TerminalController",[ ]);

    //TODO:poner los textos de los Injectors
    terminalsControllerModule.controller('TerminalController', function($http,$log,$scope,$routeParams,config,$rootScope) {

        $scope.terminals = [];

        init();

        //Get all terminals
        function init() {

            $http.get(config.getTerminalsURL).
                success(function(data, status, headers, config) {

                    $log.log("Received Terminals:" + JSON.stringify(data));

                    //TODO:validar que el data llega bien como es --no es undefined

                    if(data.type) {
                        $log.log("Error getting events");
                        $rootScope.$broadcast('AlertEvent', data.message);
                    }
                    else {
                        $scope.terminals = data;
                    }

                }).
                error(function(data, status, headers, config) {

                    //TODO:Manage the error and send a message to the scope
                    $log.log('Error');
                });
        };

        //Add new Terminal

        //Delete Terminal

    });

})();