/**
 * Created by gal on 1/12/15.
 */
(function(){

    var alertModule = angular.module("AlertModule");

    alertModule.directive('alertsDisplay', ['$log', function($log){
        return {
            restrict: 'E',
            templateUrl:'./app/shared/alerts/alerts.html',
            replace: true,
            controller:['$scope', function($scope) {

                $scope.errorMessage = "";
                $scope.showError = false;

                $scope.showSuccess = false;
                $scope.successMessage = "";

                $scope.alertMessages = [];

                $scope.deleteAlert = function(deleteAlert) {

                    var deleteIndex = -1;
                    $scope.alertMessages.forEach(function(element,index){

                        if(deleteAlert === element) {
                            deleteIndex = index;
                        }
                    });

                    if(deleteIndex > 0)
                        $scope.alertMessages.splice(deleteIndex,1);

                };

                $scope.$on('AlertEvent', function (event, message) {

                    var messageObject = {
                        message: message
                    };

                    $log.debug("AlertEvent Call:" + JSON.stringify(messageObject));
                    $scope.alertMessages.push(messageObject);
                });

                $scope.$on('SuccessMessage', function (event, message) {

                    $log.debug("Success Message Call:" + JSON.stringify(message));

                    $scope.showSuccess = true;
                    $scope.successMessage = message;
                });
            }]
        }
    }]);
})();