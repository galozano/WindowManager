/**
 * Created by gal on 1/18/15.
 */
(function(){

    var userModule = angular.module("UserModule");

    userModule.controller("UserController",['$http','$log','$scope','$routeParams','config','alertService','$sessionStorage',
        function($http,$log,$scope,$routeParams,config,alertService,$sessionStorage){

        $scope.newUser = "";
        $scope.formError = "";

        $scope.changePassword = function(newUser) {

            $log.debug("Change Password");

            if ($scope.changePasswordForm.$invalid) {
                $log.debug("Invalid Form");
                $scope.changePasswordForm.showValidation = true;
                return;
            }

            if(newUser.newPassword != newUser.confirmPassword) {

                $scope.formError = "Confirm Password is not the same as new Password";
                return;
            }

            var userJSON = {
                "userEmail":$sessionStorage.userEmail,
                "oldPassword":newUser.oldPassword,
                "newPassword":newUser.newPassword
            };

            $http.post(config.changePasswordURL, userJSON).
                success(function(data, status, headers, config){

                    if(data.code)
                        alertService.pushMessage(data);
                    else
                        alertService.pushSuccessMessage("Password changed");

                }).fail(function(data, status, headers, config) {
                    alertService.pushMessage("Connection Error");
                });
        };

    }]);
})();