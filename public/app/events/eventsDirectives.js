/**
 * Created by gal on 11/30/14.
 */

(function() {

    var eventModule = angular.module("eventsDirectives",[ ]);

    //--------------------------------------------------------------------
    // Globar Variables
    //--------------------------------------------------------------------

    var tableDayHeight = 84;
    var tableDayHeightNoBorder = 83;
    var tableTopHeaderHeight = 29;
    var tableLeftHeaderWidth = 100;
    var tableTotalWidth = 1099;

    var hoursInDay = 24;
    var berthLengthMeters = 1000;

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
        var arrivingTime;
        var duration;
        var eventStart;
        var eventLength;
        var day;
    }

    //--------------------------------------------------------------------
    // General Functions
    //--------------------------------------------------------------------

    function eventToCSS(event) {

        //TODO: Falta que lo calcule por minuto tambien
        var splitArray = event.arrivingTime.split(":");
        var arrivingTime = parseInt(splitArray[0],10);

        var top = ((event.day - 1) * tableDayHeight)  +  ((tableDayHeightNoBorder/hoursInDay) * arrivingTime) +  tableTopHeaderHeight;
        var bottom = ((event.day - 1) * tableDayHeight)  +  ((tableDayHeightNoBorder/hoursInDay) * (arrivingTime + event.duration)) +  tableTopHeaderHeight;

        var left = (event.eventStart * (tableTotalWidth-tableLeftHeaderWidth)/berthLengthMeters) + tableLeftHeaderWidth;
        var right = ((event.eventStart + event.eventLength) * (tableTotalWidth-tableLeftHeaderWidth)/berthLengthMeters) + tableLeftHeaderWidth;

        var eventCSS = new EventCSS();
        eventCSS.top = top;
        eventCSS.left = left;
        eventCSS.width = right-left;
        eventCSS.height = bottom - top;

        return eventCSS;
    }

    function CSSToEvent(eventCSS) {

        //TODO:falta considerar los minutos en todo

        var x = eventCSS.left;
        var y = eventCSS.top;

        var eventStart = (x - tableLeftHeaderWidth) * (berthLengthMeters/(tableTotalWidth-tableLeftHeaderWidth));
        var eventDay = (Math.ceil((y - tableTopHeaderHeight)/tableDayHeight));
        var arrivingTime = ((y - tableTopHeaderHeight) % tableDayHeight) * (hoursInDay/tableDayHeightNoBorder) ;

        var arrivingTimeFormat = parseInt(arrivingTime) + ":00";

        var movedEvent =
        {
            eventStart:eventStart,
            eventDay:eventDay,
            arrivingTime: arrivingTimeFormat
        };

        return movedEvent;
    }

    eventModule.directive('event', ['$log','$document',function($log,$document) {

        return {
            restrict: 'E',
            templateUrl: './app/events/event.html',
            replace: true,
            transclude:true,
            link:function(scope, elem, attrs)
            {
                var startX = 0;
                var startY = 0;
                var x = 0;
                var y = 0;

                scope.$watch('eventChange', function (val) {

                    $log.log("Event Change:" + JSON.stringify(scope.event));

                    var eventCSS = eventToCSS(scope.event);

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

                    var changedEvent = CSSToEvent(eventCSS);

                    scope.event.day = changedEvent.eventDay;
                    scope.event.eventStart = parseInt(changedEvent.eventStart);
                    scope.event.arrivingTime = changedEvent.arrivingTime;

                    scope.moveEvent(scope.event);
                    scope.$apply();

                    $log.log(scope.event);

                }
            }
        };
    }]);

    eventModule.directive('resizer', function($document,$log) {
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
