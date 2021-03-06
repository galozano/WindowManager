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
                    $log.debug("Terminal 3:" + JSON.stringify($scope.terminal));
                    createTerminalViewObject($scope.terminal);
                });
            }],
            link:function(scope, elem, attrs) {

                var topHeight = $('#tableTopHeader').height();

                $log.debug("TOP HEIGHT:" + topHeight);
            }
        }
    }]);

    eventModule.directive('event', ['$log','$document','tableProp', function($log,$document,tableProp) {
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
                editCranesModal:'&editCranesModal',
                viewEventModal:'&viewEventModal'
            },
            controller:['$scope',function($scope){

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
                    //var arrivingTime = parseInt(splitArray[0],10);
                    //var arrivingTimeSec = parseInt(splitArray[1],10);

                    var arrivingTime = parseFloat(splitArray[0]);
                    var arrivingTimeSec = parseFloat(splitArray[1]);

                    var top = ((event.eventDay - 1) * tableProp.tableDayHeight)  +  ((tableProp.tableDayHeightNoBorder/tableProp.hoursInDay) * arrivingTime) +  tableProp.tableTopHeaderHeight;
                    var bottom = ((event.eventDay - 1) * tableProp.tableDayHeight)  +  ((tableProp.tableDayHeightNoBorder/tableProp.hoursInDay) * (arrivingTime + event.eventCalculatedDuration)) +  tableProp.tableTopHeaderHeight;

                    $log.debug("Event Calculated TOP:"+ top);
                    $log.debug("Event Calculated BOTTOM:"+ bottom);

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

                    var eventDay = 0;

                    //Analyze if its on the very top
                    if(y - tableProp.tableTopHeaderHeight == 0){
                        eventDay =1;
                    }else{
                        //Get the day where th event is
                        eventDay  = (Math.ceil((y - tableProp.tableTopHeaderHeight)/tableProp.tableDayHeight));
                    }

                    var eventStart = (x - tableProp.tableLeftHeaderWidth) * (berthLengthMeters/(tableProp.tableTotalWidth-tableProp.tableLeftHeaderWidth));
                    var eventArrivingTime = ((y - tableProp.tableTopHeaderHeight) % tableProp.tableDayHeight) * (tableProp.hoursInDay/tableProp.tableDayHeightNoBorder) ;

                    eventArrivingTime = Math.round(eventArrivingTime * 100) / 100;

                    $log.debug("Event Arriving Time:" + eventArrivingTime);

                    var difference = parseInt((eventArrivingTime - parseInt(eventArrivingTime)) * 100);
                    $log.debug("Event Arriving Time Difference:" + difference);

                    //Calculate the minutes based on the difference of the actual and specific arriving time
                    var arrivingMinutes = Math.floor((difference/100) * tableProp.minutesHour);
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
                    eventStart = parseInt(eventStart);
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

                    $(elem).css('background-color', eventCopy.eventColor);

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

                    if(y < tableProp.tableTopHeaderHeight) {
                        y = tableProp.tableTopHeaderHeight;
                    }

                    if(x < tableProp.tableLeftHeaderWidth){
                        x = tableProp.tableLeftHeaderWidth;
                    }

                    if(x < tableProp.tableTotalWidth){

                        elem.css({
                            top: y + 'px',
                            left: x + 'px'
                        });
                    }
                }

                function mouseup() {
                    $document.off('mousemove', mousemove);
                    $document.off('mouseup', mouseup);

                    x = Math.round(x);
                    y = Math.round(y);

                    var eventCSS = {
                        left: x,
                        top:y
                    };

                    $log.debug("Mouse up:" + JSON.stringify(eventCSS));

                    if(eventCSS.left < tableProp.tableTotalWidth){

                        var changedEvent = scope.CSSToEvent(eventCSS,scope.terminal);

                        scope.event.eventDay = changedEvent.eventDay;
                        scope.event.eventStart = changedEvent.eventStart;
                        scope.event.eventArrivingTime = changedEvent.eventArrivingTime;
                        scope.event.berthId = changedEvent.berthId;

                        scope.moveEvent(scope.event);
                        scope.$apply();

                        $log.debug("New scope event:" + JSON.stringify(scope.event));
                    }
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
