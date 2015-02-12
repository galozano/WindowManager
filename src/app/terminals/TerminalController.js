/**
 * Created by gal on 12/15/14.
 */
(function(){

    var terminalModule = angular.module("TerminalModule");

    terminalModule.controller('TerminalController', ['$http','$log','$scope','$routeParams','config','alertService','terminalService','_', function($http,$log,$scope,$routeParams,config,alertService,terminalService,_) {

        //------------------------------------------------------------------------
        // Scope Variables
        //------------------------------------------------------------------------

        $scope.terminals = [];

        $scope.berthSchemas = [];

        $scope.cranesSchemas = [];

        $scope.newBerthSchema = {};

        $scope.newCraneSchema = {};

        $scope.viewMode = false;

        //------------------------------------------------------------------------
        // Initialization
        //------------------------------------------------------------------------

        init();

        //Get all terminals
        function init() {

            terminalService.getTerminals().then(function(result){
                $scope.terminals = result;
            }, function(err){
                alertService.pushMessage(err);
            });

            terminalService.getTerminalSchemas().then(function(result){
                $scope.berthSchemas = result;
            }, function(err) {
                alertService.pushMessage(err);
            });

            terminalService.getCranesSchemasConfigs().then(function(result){
                $scope.cranesSchemas = result;
            }, function(err) {
                alertService.pushMessage(err);
            });
        }

        $scope.addNewBerth = function addNewBerth (newBerth) {

            if(newBerth && !$scope.berthForm.$invalid){
                if(!$scope.newBerthSchema.berths)
                    $scope.newBerthSchema.berths = [];

                if(!newBerth.berthStart)
                    newBerth.berthStart = false;

                if($scope.newBerthSchema.berths.length == 0)
                    newBerth.berthStart = true;

                var newBerthCopy = angular.copy(newBerth);
                newBerthCopy.berthSequence =  ($scope.newBerthSchema.berths.length + 1);
                $log.debug("New Berth Add:" + JSON.stringify(newBerthCopy));

                $scope.newBerthSchema.berths.push(newBerthCopy);
                $scope.newBerth = {};
            }
        };

        $scope.deleteBerth = function deleteBerth(deleteBerth){

            var indexToDelete = -1;
            $scope.newBerthSchema.berths.forEach(function(element,index){

                if(element === deleteBerth){
                    indexToDelete = index;
                }
            });

            $scope.newBerthSchema.berths.splice(indexToDelete,1);

            if($scope.newBerthSchema.berths.length >= 1){
                $scope.newBerthSchema.berths[0].berthStart = true;
            }
        };

        $scope.createNewBerthSchema = function createNewBerthSchema(newBerthSchema) {

            $log.debug("New Berth Schema to Add:" + angular.toJson(newBerthSchema));

            if(newBerthSchema
                && newBerthSchema.terminalConfigSchemaName != ""
                && newBerthSchema.berths
                && newBerthSchema.berths.length > 0){

                terminalService.createTerminalSchema(newBerthSchema).then(function(result){

                    $log.debug("Berth Schema added:" + JSON.stringify(result));

                    $scope.berthSchemas = result;
                    $('#berthModal').modal('hide');
                    $scope.newBerthSchema = {};

                }, function(err) {
                    alertService.pushMessage(err);
                });
            }
        };

        $scope.addNewCrane = function addNewCrane(newCrane) {

            $log.debug("New crane:" + JSON.stringify(newCrane));

            if(newCrane) {
                if(!$scope.newCraneSchema.cranes)
                    $scope.newCraneSchema.cranes = [];

                var newCraneCopy = angular.copy(newCrane);
                $scope.newCraneSchema.cranes.push(newCrane);
                $scope.newCrane = {};
            }
        };

        $scope.deleteCrane = function deleteCrane(deleteCrane) {

            var indexToDelete = -1;
            $scope.newCraneSchema.cranes.forEach(function(element,index){

                if(element === deleteCrane){
                    indexToDelete = index;
                }
            });

            $scope.newCraneSchema.cranes.splice(indexToDelete,1);
        };

        $scope.createCraneSchema = function createCraneSchema(newCraneSchema) {

            $log.debug("New Crane Schema to Add:" + JSON.stringify(newCraneSchema));

            if(newCraneSchema
                && newCraneSchema.craneConfigSchemaName != ""
                && newCraneSchema.cranes
                && newCraneSchema.cranes.length > 0){

                $log.debug("NewCraneSchema OK and craneform OK");

                terminalService.createCraneSchema(newCraneSchema).then(function(result){

                    $scope.newCraneSchema = {};
                    $scope.cranesSchemas = result;
                    $('#craneModal').modal('hide');

                }, function(err) {
                    alertService.pushMessage(err);
                });
            }
        };

        $scope.createTerminal = function createTerminal(newTerminal) {

            $log.debug("create new terminal:" + JSON.stringify(newTerminal));

            if(newTerminal){

                terminalService.createTerminal(newTerminal).then(function(result){

                    $scope.terminals = result;
                    $scope.newTerminal = {};
                    $('#terminalModal').modal('hide');

                }, function(err){
                    alertService.pushMessage(err);
                });
            }
        };

        $scope.changeToEditMode = function changeToEditMode() {

            $scope.newBerthSchema = {};
            $scope.newCraneSchema = {};

            $scope.viewMode = false;
        };

        $scope.viewBerthSchema = function viewBerthSchema(berthSchema) {

            $scope.viewMode = true;

            $scope.berthSchemas.forEach(function(element){

                if(element === berthSchema)
                    $scope.newBerthSchema = element;

            });
        };

        $scope.viewCraneSchema = function viewCraneSchema(craneSchema){

            $scope.viewMode = true;

            $scope.cranesSchemas.forEach(function(element){

                if(element === craneSchema)
                    $scope.newCraneSchema = element;

            });
        };

        $scope.deleteTerminal = function deleteTerminal(terminal){

            if(terminal){
                terminalService.deleteTerminal(terminal).then(function(result){

                    $scope.terminals = result;

                }, function(err){
                    alertService.pushMessage(err);
                });
            }

        };

    }]);
})();