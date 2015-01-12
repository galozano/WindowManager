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
            controller:function($scope) {

                $scope.errorMessage = "";
                $scope.showError = false;

                $scope.$on('AlertEvent', function (event, message) {

                    $log.debug("AlertEvent Call:" + message);

                    $scope.showError = false;
                    $scope.showError = true;
                    $scope.errorMessage = message;
                });
            }
        }
    }]);
})();