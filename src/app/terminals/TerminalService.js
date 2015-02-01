/**
 * Created by gal on 1/31/15.
 */
(function(){

    var terminalModule = angular.module("TerminalModule");

    terminalModule.service("terminalService", ['$http','$log','config','_','alertService','$q','errors',function($http,$log,config,_,alertService,$q,errors){

        var terminal = {};

        function constructMainBerths(berths) {
            var berthsMainLength  = {};

            //Hago un array de los berths con start true y su longitude
            var sum = 0;
            var lastBerthId = "";

            for(var i = 0 ; i < berths.length ; i++) {

                var berth = berths[i];

                if(berth.berthStart) {
                    berthsMainLength[berth.berthId] = {sumLength: sum,berthName: berth.berthName, berthId:berth.berthId};
                }

                sum += berth.berthLength;
            }

            return berthsMainLength;
        }

        this.getTerminal = function getTerminal(terminalId) {

            var deferred = $q.defer();

            $http.get(config.getTerminalURL+"/"+terminalId).
                success(function(data, status, headers, config) {

                    $log.debug("Terminal Info Received:" + JSON.stringify(data));

                    //Validate is message is an error
                    if(data.type) {
                        deferred.reject(data);
                    }
                    else {
                        terminal = data;

                        if(data.berths) {
                            terminal.mainBerths = constructMainBerths(terminal.berths);

                            deferred.resolve(terminal);
                        }
                        else
                            deferred.reject(errors.connectionError);
                    }
                }).
                error(function(data, status, headers, config) {
                    deferred.reject(errors.connectionError);
                });

            return deferred.promise;
        };

    }]);
})();