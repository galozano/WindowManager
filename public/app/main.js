/**
 * Created by gal on 10/11/14.
 */

//TODO: Poner comentarios en todo lados

(function() {

    angular.module("AlertModule",[ ]);
    angular.module("NavigationModule",[ ]);
    angular.module("LoginModule",[ ]);
    angular.module("EventModule",[ ]);
    angular.module("TerminalModule",[ ]);

    var app = angular.module("myAPP",[
        "ngRoute",
        "ngStorage",
        "720kb.tooltips",
        "AlertModule",
        "LoginModule",
        "EventModule",
        "TerminalModule",
        "NavigationModule"]);

    app.constant('config',{
        getEventURL:'/events/getEvents',
        addEventURL:'/events/addEvent',
        editEventURL:'/events/editEvent',
        deleteEventURL:'/events/deleteEvent',
        getTerminalsURL:'/terminals/getTerminals',
        getTerminalURL:'/terminals/getTerminal',
        editCranesURL:'/cranes/editEventCranes',
        loginUserURL:'/users/login'
    });

    //--------------------------------------------------------------------
    // Interceptors
    //--------------------------------------------------------------------

    app.config(function($logProvider){
        $logProvider.debugEnabled(true);
    });

    app.config(['$httpProvider',function($httpProvider) {
        $httpProvider.interceptors.push(['$q', '$location','$log','$localStorage', function($q, $location,$log,$localStorage) {
            return {
                'request': function (config) {
                    $log.debug("Intersected");

                    config.headers = config.headers || {};
                    config.headers.Accept = "application/json";

                    if ($localStorage.userToken) {
                        config.headers.Authorization = 'Bearer ' + $localStorage.userToken;
                    }

                    $log.debug("Config Headers After:" + JSON.stringify(config.headers));

                    return config;
                },
                'responseError': function(response) {
                    if(response.status === 401 || response.status === 403) {
                        $location.path('/');
                    }
                    return $q.reject(response);
                }
            };
        }]);
    }]);

    //--------------------------------------------------------------------
    // General Factories
    //--------------------------------------------------------------------

    app.factory('_', function() {
        return window._; // assumes underscore has already been loaded on the page
    });

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
        }).when('/',{
            templateUrl: 'app/login/login.html',
            controller: 'LoginController'
        }).otherwise({
            redirectTo: '/'
        });
    }]);
})();