/**
 * Created by gal on 10/11/14.
 */
(function() {

    angular.module("AlertModule",[ ]);
    angular.module("NavigationModule",[ ]);
    angular.module("LoginModule",[ ]);
    angular.module("EventModule",[ ]);
    angular.module("TerminalModule",[ ]);
    angular.module("UserModule",[ ]);

    var app = angular.module("myAPP",[
        "ngRoute",
        "ngStorage",
        "720kb.tooltips",
        "AlertModule",
        "LoginModule",
        "EventModule",
        "TerminalModule",
        "NavigationModule",
        "UserModule"]);

    app.constant('config',{
        getEventURL:'/events/getEvents',
        addEventURL:'/events/addEvent',
        editEventURL:'/events/editEvent',
        deleteEventURL:'/events/deleteEvent',
        getTerminalsURL:'/terminals/getTerminals',
        getTerminalURL:'/terminals/getTerminal',
        editCranesURL:'/cranes/editEventCranes',
        loginUserURL:'/users/login',
        changePasswordURL:'/users/password'
    });

    app.constant('errors',{
        connectionError: {
            "userMessage": "Connection error, please contact Colibri support",
            "message": "Connection error, please contact Colibri support",
            "type": "ERROR",
            "code":"CONNECTION_ERROR"
        }
    });

    app.constant('tableProp',{
        tableDayHeight: 84,
        tableDayHeightNoBorder: 83,
        tableTopHeaderHeight: 29,
        tableLeftHeaderWidth: 100,
        tableTotalWidth: 1099,
        cellHourHeight: 3.5, //TableDayHeight/12 cells
        hoursInDay: 24,
        minutesHour: 60,
        totalPixelLength:999
    });

    //--------------------------------------------------------------------
    // Interceptors
    //--------------------------------------------------------------------

    app.config(['$logProvider',function($logProvider){
        $logProvider.debugEnabled(true);
    }]);

    app.config(['$httpProvider',function($httpProvider) {
        $httpProvider.interceptors.push(['$q','$location','$log','$sessionStorage','alertService',
            function($q, $location,$log,$sessionStorage,alertService) {
                return {
                    'request': function (config) {
                        $log.debug("Intersected");

                        config.headers = config.headers || {};
                        config.headers.Accept = "application/json";

                        if ($sessionStorage.userToken) {
                            config.headers.Authorization = 'Bearer ' + $sessionStorage.userToken;
                        }

                        $log.debug("Config Headers After:" + JSON.stringify(config.headers));

                        return config;
                    },
                    'responseError': function(response) {
                        if(response.status === 401 || response.status === 403) {
                            $location.path('/');
                        }
                        else if(response.code) {
                            alertService.pushMessage(response);
                        }
                        return $q.reject(response);
                    }
                };
            }]);
    }]);

    //--------------------------------------------------------------------
    // General Factories
    //--------------------------------------------------------------------

    app.factory('_', [function() {
        return window._; // assumes underscore has already been loaded on the page
    }]);

    //--------------------------------------------------------------------
    // Routes
    //--------------------------------------------------------------------

    app.config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/events/:terminalId', {
            templateUrl: 'app/events/events.html',
            controller: 'EventController'
        }).when('/terminals',{
            templateUrl: 'app/terminals/terminals.html',
            controller: 'TerminalController'
        }).when('/user',{
            templateUrl: 'app/user/user.html',
            controller: 'UserController'
        }).when('/',{
            templateUrl: 'app/login/login.html',
            controller: 'LoginController'
        }).otherwise({
            redirectTo: '/'
        });
    }]);

})();