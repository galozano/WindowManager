/**
 * Created by gal on 12/15/14.
 */
(function(){

    var terminalModule = angular.module("TerminalModule");

    terminalModule.controller('TerminalController', ['$http','$log','$scope','$routeParams','config','alertService', function($http,$log,$scope,$routeParams,config,alertService) {

        //------------------------------------------------------------------------
        // Scope Variables
        //------------------------------------------------------------------------

        $scope.terminals = [];

        //------------------------------------------------------------------------
        // Initialization
        //------------------------------------------------------------------------


        init();

        //Get all terminals
        function init() {

            $http.get(config.getTerminalsURL).
                success(function(data, status, headers, config) {

                    $log.debug("Received Terminals:" + JSON.stringify(data));

                    if(data.type) {
                        alertService.pushMessage(data);
                    }
                    else {
                        $scope.terminals = data;
                    }

                }).
                error(function(data, status, headers, config) {

                    alertService.pushMessage("Connexion Refused");
                });
        };
    }]);

})();