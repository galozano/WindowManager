/**
 * Created by gal on 1/2/15.
 */
(function(){

    var eventsServiceModule = angular.module("EventsService",[ ]);

    eventsServiceModule.factory('Event',function(){

        //Estas variables deben quedar como configuracion en algun lado
        var tableDayHeight = 84;
        var tableDayHeightNoBorder = 83;
        var tableTopHeaderHeight = 29;
        var tableLeftHeaderWidth = 100;
        var tableTotalWidth = 1099;

        var hoursInDay = 24;

        function Event(eventName,eventArrivingTime,eventDuration,eventStart,eventLength,eventDay,berthId,terminalId) {
            this.eventName = eventName;
            this.eventArrivingTime = eventArrivingTime;
            this.eventDuration = eventDuration;
            this.eventLength = eventLength;
            this.eventDay = eventDay;
            this.berthId = berthId;
            this.terminalId = terminalId;
        };


        Event.prototype.getEventCSS = function(terminal) {

            var berthLengthMeters = terminal.totalLength;

            //Dependending on the main berths add the other berths to add
            this.eventStart = this.eventStart +  terminal.mainBerths[this.berthId].sumLength;

            console.log("Modified Event:" + JSON.stringify(event));

            //TODO: Falta que lo calcule por minuto tambien
            var splitArray = this.eventArrivingTime.split(":");
            var arrivingTime = parseInt(splitArray[0],10);

            var top = ((this.eventDay - 1) * tableDayHeight)  +  ((tableDayHeightNoBorder/hoursInDay) * arrivingTime) +  tableTopHeaderHeight;
            var bottom = ((this.eventDay - 1) * tableDayHeight)  +  ((tableDayHeightNoBorder/hoursInDay) * (arrivingTime + this.eventDuration)) +  tableTopHeaderHeight;

            var left = (this.eventStart * (tableTotalWidth-tableLeftHeaderWidth)/berthLengthMeters) + tableLeftHeaderWidth;
            var right = ((this.eventStart + this.eventLength) * (tableTotalWidth-tableLeftHeaderWidth)/berthLengthMeters) + tableLeftHeaderWidth;

            var eventCSS = {
                top: top,
                left: left,
                width: (right - left),
                height: (bottom - top)
            };

            return eventCSS;
        };

        Event.prototype.eventFromCSS = function (CSSEvent) {

        };

        Event.prototype.eventFromJSON = function(eventJSON) {

        };

        Event.prototype.toJSON = function( ) {

        };
    });


    eventsServiceModule.factory('Terminal', function() {

        function Terminal(){
            this.eventsList = [];
        };


        Terminal.prototype.initTerminal = function(terminalId) {


        };

        Terminal.prototype.addEvent = function(newEvent) {


        };

        Terminal.prototype.editEvent = function(newEvent) {


        };

        Terminal.prototype.deleteEvent = function(newEvent) {


        };

    });

})();

