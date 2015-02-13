/**
 * Created by gal on 1/31/15.
 */
(function(){

    var terminalModule = angular.module("TerminalModule");

    /**
     * Terminal Module service which handles all the information exchange with the server
     */
    terminalModule.service("terminalService", ['$http','$log','config','_','alertService','$q','errors',function($http,$log,config,_,alertService,$q,errors){

        //------------------------------------------------------------------------
        // Variables
        //------------------------------------------------------------------------

        /**
         * Selected Terminal by the user when viewing one particular terminal
         * This is only for the Calendar View
         * @type {{}}
         */
        var terminal = {};

        /**
         * Terminals being viewed by the user
         * @type {Array}
         */
        var terminals = [];

        /**
         * Berths being viewed by the user
         * @type {Array}
         */
        var berthsSchemas = [];

        /**
         * Cranes Schemas being viewed by the user
         * @type {Array}
         */
        var cranesSchemas = [];

        //------------------------------------------------------------------------
        // Private Functions
        //------------------------------------------------------------------------

        /**
         * Constructs the main berths array for the controller
         * @param berths - Ther current berths of the terminal
         * @returns {{array with only the main berths - main berths are the one that have berthStart 'YES'}}
         */
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

        /**
         *
         * @param terminalId
         * @returns {jQuery.promise|promise.promise|d.promise|promise|.ready.promise|Q.promise|*}
         */
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

        /**
         *
         * @returns {jQuery.promise|promise.promise|d.promise|promise|.ready.promise|Q.promise|*}
         */
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

        /**
         *
         * @returns {jQuery.promise|promise.promise|d.promise|promise|.ready.promise|Q.promise|*}
         */
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

        /**
         *
         * @param newTerminalSchema
         * @returns {jQuery.promise|promise.promise|d.promise|promise|.ready.promise|Q.promise|*}
         */
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

        /**
         *
         * @returns {jQuery.promise|promise.promise|d.promise|promise|.ready.promise|Q.promise|*}
         */
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

        /**
         *
         * @param newCraneSchema
         * @returns {jQuery.promise|promise.promise|d.promise|promise|.ready.promise|Q.promise|*}
         */
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

        /**
         * Create a new terminal
         * @param newTerminal - the terminal data to create the new terminal
         * @returns {jQuery.promise|promise.promise|d.promise|promise|.ready.promise|Q.promise|*}
         */
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

        /**
         * Delete an specific terminal
         * @param terminal - terminal to delete
         * @returns {jQuery.promise|promise.promise|d.promise|promise|.ready.promise|Q.promise|*}
         */
        this.deleteTerminal = function deleteTerminal(terminal) {

            $log.debug("Delete Terminal:" + JSON.stringify(terminal));

            var deferred = $q.defer();
            var dataToSend = {data:JSON.stringify({
                terminalId: terminal.terminalId
            })};

            $http.post(config.deleteTerminal, dataToSend).
                success(function(data, status, headers, config) {

                    //Validate if message is an error
                    if(data.status == "OK" && data.data) {

                        var deleteIndexTerminal = -1;
                        terminals.forEach(function(element,index){

                            if(element == terminal)
                                deleteIndexTerminal = index;

                        });

                        terminals.splice(deleteIndexTerminal,1);
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

        /**
         * Delete an specific Berth or Terminal Schema
         * @param berthSchema - schema to delete
         * @returns {jQuery.promise|promise.promise|d.promise|promise|.ready.promise|Q.promise|*}
         */
        this.deleteBerthSchema = function deleteBerthSchema(berthSchema) {

            $log.debug("Delete Terminal Schema:" + JSON.stringify(berthSchema));

            var deferred = $q.defer();
            var dataToSend = {data:JSON.stringify({
                terminalConfigSchemaId: berthSchema.terminalConfigSchemaId
            })};

            $http.post(config.deleteTerminalSchema, dataToSend).
                success(function(data, status, headers, config) {

                    //Validate if message is an error
                    if(data.status == "OK" && data.data) {

                        var deleteIndexTerminal = -1;
                        berthsSchemas.forEach(function(element,index){

                            if(element == berthSchema)
                                deleteIndexTerminal = index;

                        });

                        berthsSchemas.splice(deleteIndexTerminal,1);
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

        /**
         * Delelete an specific Crane Schema
         * @param craneSchema - crane schema selected to delete
         * @returns {jQuery.promise|promise.promise|d.promise|promise|.ready.promise|Q.promise|*}
         */
        this.deleteCraneSchema = function deleteCraneSchema(craneSchema) {

            $log.debug("Delete Crane Schema:" + JSON.stringify(craneSchema));

            var deferred = $q.defer();
            var dataToSend = {data:JSON.stringify({
                craneConfigSchemaId: craneSchema.craneConfigSchemaId
            })};

            $http.post(config.deleteCraneSchema, dataToSend).
                success(function(data, status, headers, config) {

                    //Validate if message is an error
                    if(data.status == "OK" && data.data) {

                        var deleteIndexCrane = -1;
                        cranesSchemas.forEach(function(element,index){

                            if(element == craneSchema)
                                deleteIndexCrane = index;

                        });

                        cranesSchemas.splice(deleteIndexCrane,1);
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
    }]);
})();