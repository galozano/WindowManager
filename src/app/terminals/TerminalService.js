/**
 * Created by gal on 1/31/15.
 */
(function(){

    var terminalModule = angular.module("TerminalModule");

    terminalModule.service("terminalService", ['$http','$log','config','_','alertService','$q','errors',function($http,$log,config,_,alertService,$q,errors){


        //------------------------------------------------------------------------
        // Variables
        //------------------------------------------------------------------------

        /**
         * Selected Terminal
         * @type {{}}
         */
        var terminal = {};

        /**
         * Terminals being viewed by the user
         * @type {Array}
         */
        var terminals = [];

        var berthsSchemas = [];
        var cranesSchemas = [];

        //------------------------------------------------------------------------
        // Private Functions
        //------------------------------------------------------------------------

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

        //------------------------------------------------------------------------
        // Public Terminal Functions
        //------------------------------------------------------------------------

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

        this.getTerminals = function getTerminals( ){

            var deferred = $q.defer();

            $http.get(config.getTerminalsURL).
                success(function(data, status, headers, config) {

                    $log.debug("Received Terminals:" + JSON.stringify(data));

                    if(data.type) {
                        deferred.reject(data);
                    }
                    else {
                        terminals = data;
                        deferred.resolve(terminals);
                    }
                }).
                error(function(data, status, headers, config) {
                    deferred.reject(errors.connectionError);
                });

            return deferred.promise;
        };

        this.getTerminalSchemas = function getTerminalSchemas( ){
            var deferred = $q.defer();

            $http.get(config.getTerminalConfigSchemas).
                success(function(data, status, headers, config) {

                    $log.debug("Schema Info Received:" + JSON.stringify(data));

                    //Validate if message is an error
                    if(data.status == "OK" && data.data) {
                        berthsSchemas = data.data;
                        deferred.resolve(berthsSchemas);
                    }
                    else if(data.status == "ERROR") {
                        deferred.reject(data.data);
                    }
                    else {
                        deferred.reject(errors.dataError);
                    }
                }).
                error(function(data, status, headers, config) {
                    deferred.reject(errors.connectionError);
                });

            return deferred.promise;
        };

        this.createTerminalSchema = function createTerminalSchema(newTerminalSchema) {

            var deferred = $q.defer();
            var dataToSend = {data:angular.toJson(newTerminalSchema)};

            $http.post(config.createTerminalSchema, dataToSend).
                success(function(data, status, headers, config) {

                    $log.debug("Schema Info Received:" + JSON.stringify(data));

                    //Validate if message is an error
                    if(data.status == "OK" && data.data) {
                        $log.debug("Data OK");
                        var dataReceived = data.data;


                        berthsSchemas.push(dataReceived);
                        deferred.resolve(berthsSchemas);
                    }
                    else if(data.status == "ERROR") {
                        deferred.reject(data.data);
                    }
                    else {
                        deferred.reject(errors.dataError);
                    }
                }).
                error(function(data, status, headers, config) {
                    deferred.reject(errors.connectionError);
                });

            return deferred.promise;
        };

        this.getCranesSchemasConfigs = function getCranesSchemasConfigs() {
            var deferred = $q.defer();

            $http.get(config.getCranesSchemas).
                success(function(data, status, headers, config) {

                    $log.debug("Schema Info Received:" + JSON.stringify(data));

                    //Validate if message is an error
                    if(data.status == "OK" && data.data) {
                        cranesSchemas = data.data;
                        deferred.resolve(cranesSchemas);
                    }
                    else if(data.status == "ERROR") {
                        deferred.reject(data.data);
                    }
                    else {
                        deferred.reject(errors.dataError);
                    }
                }).
                error(function(data, status, headers, config) {
                    deferred.reject(errors.connectionError);
                });

            return deferred.promise;
        };

        this.createCraneSchema = function createCraneSchema(newCraneSchema){

            $log.debug("New Crane Schema Terminal Service:" + JSON.stringify(newCraneSchema));

            var deferred = $q.defer();
            var dataToSend = {data:angular.toJson(newCraneSchema)};

            $http.post(config.createCraneSchema, dataToSend).
                success(function(data, status, headers, config) {

                    $log.debug("Schema Info Received:" + JSON.stringify(data));

                    //Validate if message is an error
                    if(data.status == "OK" && data.data) {
                        $log.debug("Data OK");
                        var dataReceived = data.data;

                        cranesSchemas.push(dataReceived);
                        deferred.resolve(cranesSchemas);
                    }
                    else if(data.status == "ERROR") {
                        deferred.reject(data.data);
                    }
                    else {
                        deferred.reject(errors.dataError);
                    }
                }).
                error(function(data, status, headers, config) {
                    deferred.reject(errors.connectionError);
                });

            return deferred.promise;
        };

        this.createTerminal = function createTerminal(newTerminal) {

            $log.debug("Create Terminal Service:" + JSON.stringify(newTerminal));

            var deferred = $q.defer();
            var dataToSend = {data:angular.toJson(newTerminal)};

            $http.post(config.createTerminal, dataToSend).
                success(function(data, status, headers, config) {

                    //Validate if message is an error
                    if(data.status == "OK" && data.data) {
                        $log.debug("Data OK");
                        var dataReceived = data.data;

                        var newTerminal = {
                            terminalId:dataReceived.terminalId,
                            terminalName: dataReceived.terminalName
                        };

                        terminals.push(newTerminal);
                        deferred.resolve(terminals);
                    }
                    else if(data.status == "ERROR") {
                        deferred.reject(data.data);
                    }
                    else {
                        deferred.reject(errors.dataError);
                    }
                }).
                error(function(data, status, headers, config) {
                    deferred.reject(errors.connectionError);
                });

            return deferred.promise;
        };

    }]);
})();