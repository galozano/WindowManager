/**
 * Created by gal on 1/12/15.
 */
(function(){

    var alertModule = angular.module("AlertModule");

    alertModule.service("alertService", ['$log','$rootScope', function($log,$rootScope){



        this.pushMessage = function(alertMessage) {

            $log.debug("Alert Message:" + JSON.stringify(alertMessage));
            $log.error('Error:' + JSON.stringify(alertMessage));

            if(alertMessage.message)
                $rootScope.$broadcast('AlertEvent', alertMessage.message);
            else
                $rootScope.$broadcast('AlertEvent', alertMessage);
        };

        this.pushSuccessMessage = function(successMessage) {

            $log.debug("Success Message:" + JSON.stringify(successMessage));
            $rootScope.$broadcast('SuccessMessage', successMessage);
        };

    }]);
})();