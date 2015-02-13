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

                $scope.$on('AlertEvent', function (event, message) {

                    $log.debug("AlertEvent Call:" + JSON.stringify(message));

                    $scope.showError = false;
                    $scope.showError = true;
                    $scope.errorMessage = message;
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