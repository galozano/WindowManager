/**
 * Created by gal on 11/30/14.
 */
(function() {

    var eventModule = angular.module("EventModule");

    eventModule.directive('tableGen', ['$log',function($log) {
        return {
            restrict: 'E',
            templateUrl: './app/events/table.html',
            scope: {
               terminal:'=terminalInfo',
               hours:'=hours'
            },
            controller:['$scope','tableProp', function($scope, tableProp){

                function createTerminalViewObject(terminalData) {

                    if(terminalData) {
                        var totalBerthLength = terminalData.totalLength;

                        for(var i = 0; i < terminalData.berths.length ; i ++) {

                            var berth = terminalData.berths[i];
                            berth.pixelLength = (tableProp.totalPixelLength/totalBerthLength) * berth.berthLength;
                        }
                    }

                    $log.debug("New Terminal Data:" + JSON.stringify(terminalData));
                }

                $scope.$watch('terminal', function(newTerminalInfo){
                    console.debug("Terminal 3:" + JSON.stringify($scope.terminal));
                    createTerminalViewObject($scope.terminal);
                });
            }]
        }
    }]);

    eventModule.directive('event', ['$log','$document', function($log,$document) {
        return {
            restrict: 'E',
            templateUrl: './app/events/event.html',
            scope:{
                event:'=event',
                terminal:'=terminalInfo',
                eventChange:'=eventChange',
                moveEvent:'&moveEvent',
                editEventModal:'&editEventModal',
                deleteEvent: '&deleteEvent',
                editCranesModal:'&editCranesModal'
            },
            controller:['$scope','tableProp',function($scope,tableProp){

                //Add the number of padding number to the number pass
                function pad(num, size) {
                    var s = num+"";
                    while (s.length < size) s = "0" + s;
                    return s;
                }

                $scope.eventToCSS = function eventToCSS(event,terminal) {

                    $log.debug("Main Event:" + JSON.stringify(event));
                    $log.debug("Terminal:" + JSON.stringify(terminal));

                    var berthLengthMeters = terminal.totalLength;

                    //Dependending on the main berths add the other berths to add
                    event.eventStart = event.eventStart +  terminal.mainBerths[event.berthId].sumLength;

                    $log.debug("Modified Event:" + JSON.stringify(event));

                    var splitArray = event.eventArrivingTime.split(":");
                    var arrivingTime = parseInt(splitArray[0],10);
                    var arrivingTimeSec = parseInt(splitArray[1],10);

                    var top = ((event.eventDay - 1) * tableProp.tableDayHeight)  +  ((tableProp.tableDayHeightNoBorder/tableProp.hoursInDay) * arrivingTime) +  tableProp.tableTopHeaderHeight;
                    var bottom = ((event.eventDay - 1) * tableProp.tableDayHeight)  +  ((tableProp.tableDayHeightNoBorder/tableProp.hoursInDay) * (arrivingTime + event.eventDuration)) +  tableProp.tableTopHeaderHeight;

                    //Calculate the amount of px to add to the top and bottom
                    var topSec = (arrivingTimeSec/tableProp.minutesHour) * tableProp.cellHourHeight;

                    //Add the seconds to the top and bottom CSS
                    top = top + topSec;
                    bottom = bottom + topSec;

                    $log.debug("arrivingTimeSec:" + arrivingTimeSec);
                    $log.debug("Add to Top:"+ topSec);

                    var left = (event.eventStart * (tableProp.tableTotalWidth-tableProp.tableLeftHeaderWidth)/berthLengthMeters) + tableProp.tableLeftHeaderWidth;
                    var right = ((event.eventStart + event.eventLength) * (tableProp.tableTotalWidth-tableProp.tableLeftHeaderWidth)/berthLengthMeters) + tableProp.tableLeftHeaderWidth;


                    var eventCSS = {
                        top: top,
                        left: left,
                        width: right-left,
                        height: bottom - top
                    };

                    return eventCSS;
                };

                $scope.CSSToEvent = function CSSToEvent(eventCSS,terminal) {

                    var x = eventCSS.left;
                    var y = eventCSS.top;
                    var berthLengthMeters = terminal.totalLength;

                    var eventStart = (x - tableProp.tableLeftHeaderWidth) * (berthLengthMeters/(tableProp.tableTotalWidth-tableProp.tableLeftHeaderWidth));
                    var eventDay = (Math.ceil((y - tableProp.tableTopHeaderHeight)/tableProp.tableDayHeight));
                    var eventArrivingTime = ((y - tableProp.tableTopHeaderHeight) % tableProp.tableDayHeight) * (tableProp.hoursInDay/tableProp.tableDayHeightNoBorder) ;

                    var difference = parseInt((eventArrivingTime - parseInt(eventArrivingTime)) *100);
                    $log.debug("Event Arriving Time:" + difference);

                    //Calculate thhe minutes based on the difference of the actual and specific arriving time
                    var arrivingMinutes = (difference/100) * tableProp.minutesHour;
                    $log.debug("Event Arriving Minutes:" + arrivingMinutes);

                    var arrivingTimeFormat = pad(parseInt(eventArrivingTime,10),2) + ":" + pad(parseInt(arrivingMinutes,10),2);

                    //Calculate which is the berth in which is over
                    var berthId = '';
                    for (var berth in terminal.mainBerths) {

                        var length = terminal.mainBerths[berth].sumLength;

                        if(eventStart >= length)
                            berthId = berth;
                    }

                    $log.debug("Berth Id: " + berthId);
                    eventStart = eventStart - terminal.mainBerths[berthId].sumLength;
                    $log.debug("Event Start After: " + eventStart);

                    var movedEvent = {
                        eventStart:eventStart,
                        eventDay:eventDay,
                        eventArrivingTime: arrivingTimeFormat,
                        berthId:berthId
                    };

                    return movedEvent;
                }

            }],
            link:function(scope, elem, attrs) {

                var startX = 0;
                var startY = 0;
                var x = 0;
                var y = 0;

                scope.$watch('eventChange', function (val) {

                    $log.debug("Event Change:" + JSON.stringify(scope.event));

                    var eventCopy = angular.copy(scope.event);
                    var eventCSS = scope.eventToCSS(eventCopy,scope.terminal);

                    $log.debug("AFTER CSS SCOPE EVENT:" + JSON.stringify(scope.event));

                    elem.css({
                        width: eventCSS.width,
                        height: eventCSS.height,
                        top: eventCSS.top,
                        left: eventCSS.left
                    });

                    startX = eventCSS.left;
                    startY = eventCSS.top;
                    x = eventCSS.left;
                    y = eventCSS.top;
                });

                elem.on('mousedown', function (event) {

                    if(event.target.className != 'resizer')
                    {
                        event.preventDefault();
                        startY = event.pageY - y;
                        startX = event.pageX - x;
                        $document.on('mousemove', mousemove);
                        $document.on('mouseup', mouseup);
                    }
                });

                function mousemove(event) {
                    y = event.pageY - startY;
                    x = event.pageX - startX;

                    elem.css({
                        top: y + 'px',
                        left: x + 'px'
                    });
                }

                function mouseup() {
                    $document.off('mousemove', mousemove);
                    $document.off('mouseup', mouseup);

                    var eventCSS = {
                        left: x,
                        top:y
                    };

                    var changedEvent = scope.CSSToEvent(eventCSS,scope.terminal);

                    scope.event.eventDay = changedEvent.eventDay;
                    scope.event.eventStart = parseInt(changedEvent.eventStart);
                    scope.event.eventArrivingTime = changedEvent.eventArrivingTime;
                    scope.event.berthId = changedEvent.berthId;

                    scope.moveEvent(scope.event);
                    scope.$apply();

                    $log.debug("New scope event:" + JSON.stringify(scope.event));
                }
            }
        };
    }]);

    //TODO:Falta terminar esto para que funcione
    eventModule.directive('resizer', ['$document', '$log',function($document,$log) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {

                var parentTop = parseInt($(element).parent().css('top'),10);
                var parentHeight = parseInt($(element).parent().css('height'),10);
                var startY = parentTop + parentHeight;

//                 $log.log("Parent Top:" + parentTop);
//                 $log.log("Parent Height:" + parentHeight);
//                 $log.log("StartY:" + startY);

                element.on('mousedown', function (event) {
                    event.preventDefault();

                    startY = event.pageY - startY;

                    $document.on('mousemove', mousemove);
                    $document.on('mouseup', mouseup);
                });

                function mousemove(event) {

                    var newHeight = (event.pageY-startY) + parentHeight;

                    $log.debug('New Height:' + newHeight);

//                     element.css({
//                         height: y + 'px'
//                     });
                }

                function mouseup() {
                    $document.unbind('mousemove', mousemove);
                    $document.unbind('mouseup', mouseup);
                }
            }
        }
    }]);
})();
