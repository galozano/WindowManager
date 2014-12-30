/**
 * Created by gal on 11/30/14.
 */
(function() {

    var eventDirectiveModule = angular.module("EventsDirectives",[ ]);

    //--------------------------------------------------------------------
    // Global Variables
    //--------------------------------------------------------------------

    //Estas variables deben quedar como configuracion en algun lado
    var tableDayHeight = 84;
    var tableDayHeightNoBorder = 83;
    var tableTopHeaderHeight = 29;
    var tableLeftHeaderWidth = 100;
    var tableTotalWidth = 1099;

    var hoursInDay = 24;

    //--------------------------------------------------------------------
    // Model
    //--------------------------------------------------------------------

    function EventCSS() {

        var top;
        var left;
        var width;
        var height;
    }

    function Event() {

        var eventName;
        var eventArrivingTime;
        var eventDuration;
        var eventStart;
        var eventLength;
        var eventDay;
    }

    //--------------------------------------------------------------------
    // General Functions
    //--------------------------------------------------------------------

    function eventToCSS(event,terminal) {

        console.log("Main Event:" + JSON.stringify(event));
        console.log("Terminal:" + JSON.stringify(terminal));

        var berthLengthMeters = terminal.totalLength;

        //Dependending on the main berths add the other berths to add
        event.eventStart = event.eventStart +  terminal.mainBerths[event.berthId].sumLength;

        console.log("Modified Event:" + JSON.stringify(event));

        //TODO: Falta que lo calcule por minuto tambien
        var splitArray = event.eventArrivingTime.split(":");
        var arrivingTime = parseInt(splitArray[0],10);

        var top = ((event.eventDay - 1) * tableDayHeight)  +  ((tableDayHeightNoBorder/hoursInDay) * arrivingTime) +  tableTopHeaderHeight;
        var bottom = ((event.eventDay - 1) * tableDayHeight)  +  ((tableDayHeightNoBorder/hoursInDay) * (arrivingTime + event.eventDuration)) +  tableTopHeaderHeight;

        var left = (event.eventStart * (tableTotalWidth-tableLeftHeaderWidth)/berthLengthMeters) + tableLeftHeaderWidth;
        var right = ((event.eventStart + event.eventLength) * (tableTotalWidth-tableLeftHeaderWidth)/berthLengthMeters) + tableLeftHeaderWidth;

        var eventCSS = new EventCSS();
        eventCSS.top = top;
        eventCSS.left = left;
        eventCSS.width = right-left;
        eventCSS.height = bottom - top;

        return eventCSS;
    }

    function CSSToEvent(eventCSS,terminal) {

        //TODO:falta considerar los minutos en todo

        var x = eventCSS.left;
        var y = eventCSS.top;
        var berthLengthMeters = terminal.totalLength;

        var eventStart = (x - tableLeftHeaderWidth) * (berthLengthMeters/(tableTotalWidth-tableLeftHeaderWidth));
        var eventDay = (Math.ceil((y - tableTopHeaderHeight)/tableDayHeight));
        var eventArrivingTime = ((y - tableTopHeaderHeight) % tableDayHeight) * (hoursInDay/tableDayHeightNoBorder) ;

        var arrivingTimeFormat = parseInt(eventArrivingTime) + ":00";

        //Calculate which is the berth in which is over
        var berthId = '';
        for (var berth in terminal.mainBerths) {

            var length = terminal.mainBerths[berth].sumLength;

            if(eventStart >= length)
                berthId = berth;
        }

        console.log("Berth Id: " + berthId);

        eventStart = eventStart - terminal.mainBerths[berthId].sumLength;

        console.log("Event Start After: " + eventStart);

        var movedEvent = {
            eventStart:eventStart,
            eventDay:eventDay,
            eventArrivingTime: arrivingTimeFormat,
            berthId:berthId
        };

        return movedEvent;
    }

    eventDirectiveModule.directive('tableGen', function( ) {
        return {
            restrict: 'E',
            templateUrl: './app/events/table.html',
            replace: true
        }
    });

    eventDirectiveModule.directive('event', ['$log','$document',function($log,$document) {

        return {
            restrict: 'E',
            templateUrl: './app/events/event.html',
            replace: true,
            transclude:true,
            link:function(scope, elem, attrs) {
                var startX = 0;
                var startY = 0;
                var x = 0;
                var y = 0;

                scope.$watch('eventChange', function (val) {

                    $log.log("Event Change:" + JSON.stringify(scope.event));

                    var eventCopy = angular.copy(scope.event);
                    var eventCSS = eventToCSS(eventCopy,scope.terminal);

                    $log.log("AFTER CSS SCOPE EVENT:" + JSON.stringify(scope.event));

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

                    var changedEvent = CSSToEvent(eventCSS,scope.terminal);

                    scope.event.eventDay = changedEvent.eventDay;
                    scope.event.eventStart = parseInt(changedEvent.eventStart);
                    scope.event.eventArrivingTime = changedEvent.eventArrivingTime;
                    scope.event.berthId = changedEvent.berthId;

                    scope.moveEvent(scope.event);
                    scope.$apply();

                    $log.log("New scope event:" + JSON.stringify(scope.event));

                }
            }
        };
    }]);


    //TODO:Falta terminar esto para que funcione
    eventDirectiveModule.directive('resizer', function($document,$log) {
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

                    $log.log('New Height:' + newHeight);

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
    });

})();
