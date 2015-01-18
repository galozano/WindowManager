/**
 * Created by gal on 1/11/15.
 */

(function(){

    var navigationModule = angular.module("NavigationModule");

    navigationModule.directive('navigationBar', ['$log','$document','$localStorage','$location',
        function($log,$document,$localStorage,$location) {
       return {
           restrict: 'E',
           templateUrl:'./app/shared/navigation/navigation.html',
           replace: true,
           controller:['$scope',function($scope) {

               $scope.logout = function() {

                   $log.debug("Logout");
                   delete $localStorage.userToken;
                   $location.path('/');
               };
           }]
       }
    }]);
})();
