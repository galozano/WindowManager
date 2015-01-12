/**
 * Created by gal on 11/9/14.
 */

//-------------------------------------------------------------
// Module Dependencies & Configurations
//-------------------------------------------------------------

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var q = require('q');
var validator = require('validator');
var jwt = require('jsonwebtoken');

var logger = require('./server/conf/logger.js');
var configCSM = require('./server/conf/config.json');

//-------------------------------------------------------------
// Initial Configuration
//-------------------------------------------------------------

var app = express();

app.set('port', configCSM.server.port);
app.engine('html', require('ejs').renderFile);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//-------------------------------------------------------------
// Connections
//-------------------------------------------------------------

connection = mysql.createConnection(configCSM.dbConn.test);

connection.config.queryFormat = function (query, values) {
    if (!values) return query;
    return query.replace(/\:(\w+)/g, function (txt, key) {
        if (values.hasOwnProperty(key)) {
            return this.escape(values[key]);
        }
        return txt;
    }.bind(this));
};


//-------------------------------------------------------------
// Module local dependencies
//-------------------------------------------------------------

var eventServerService  = require('./server/events/EventServerService.js')(connection,logger,configCSM,q);
var eventServerController = require('./server/events/EventServerController.js')(express,connection,logger,configCSM,eventServerService);

var craneServerController = require('./server/CraneServerController.js')(express,connection,logger,configCSM,q,eventServerService);

var terminalServerController = require('./server/TerminalServerController.js')(express,connection,logger,configCSM,q);

var loginServerController = require('./server/LoginServerController.js')(express,connection,configCSM,logger,q,validator,jwt);

var authenticationMiddleware = require('./server/AuthenticationMiddleware.js')(express,connection,configCSM,logger,q);

app.use(configCSM.urls.events.main,authenticationMiddleware.ensureAuthorized);
app.use(configCSM.urls.terminals.main,authenticationMiddleware.ensureAuthorized);
app.use(configCSM.urls.cranes.main,authenticationMiddleware.ensureAuthorized);

app.use(configCSM.urls.events.main, eventServerController);
app.use(configCSM.urls.terminals.main, terminalServerController);
app.use(configCSM.urls.cranes.main, craneServerController);
app.use(configCSM.urls.users.main,loginServerController);


//-------------------------------------------------------------
// Routes
//-------------------------------------------------------------

app.get('/', function (req,res) {

    res.render('index.html');
});

//-------------------------------------------------------------
// Main Start Server
//-------------------------------------------------------------

var server = app.listen(app.get('port'), function() {

    var host = server.address().address;
    var port = server.address().port;

    logger.info('App listening at http://%s:%s \n', host, port);
});