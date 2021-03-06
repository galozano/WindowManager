/**
 * Created by gal on 1/7/15.
 */
(function() {

    var loginModule = angular.module("LoginModule");

    loginModule.controller("LoginController", ['$http','$log','$scope','$routeParams','config','$rootScope','_','$location','$sessionStorage',
        function($http,$log,$scope,$routeParams,config,$rootScope,_,$location,$sessionStorage){

        $scope.loginUser = "";
        $scope.showPage = false;
        $scope.formError = "";

        if($sessionStorage.userToken && $sessionStorage.userToken != "") {
            $location.path('/terminals');
        }
        else
            $scope.showPage = true;

        $scope.login = function(loginUser) {

            $log.debug("Login with:" + JSON.stringify(loginUser));

            var loginJSON = {
                "userEmail":loginUser.email,
                "userPassword":loginUser.password
            };

            $http.post(config.loginUserURL, loginJSON).
                success(function(data, status, headers, config) {
                    $log.debug("Received Edit Data:" + JSON.stringify(data));

                    if(data.userToken && data.userToken != '') {
                        //Llegue el usuario y se guarde el token
                        $sessionStorage.userToken = data.userToken;
                        $sessionStorage.userEmail = data.userEmail;

                        //Enviar el usuario a la pagina principal de las terminales
                        $location.path('/terminals');
                    }
                    else
                        $scope.formError = "Invalid email or password";
                }).
                error(function(data, status, headers, config) {

                    //TODO:Manage the error and send a message to the scope
                    $log.debug('Error');
                });
        };
    }]);

})();