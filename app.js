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

app.set('port', process.env.PORT);
app.engine('html', require('ejs').renderFile);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//-------------------------------------------------------------
// Connections
//-------------------------------------------------------------

var poolConnections = mysql.createPool({
        "host": process.env.DB_URL,
        "user":process.env.DB_USER,
        "password":process.env.DB_PASS,
        "database": "CSM",
        "connectionLimit" : 10
});

poolConnections.on('connection', function (connection) {
    logger.debug("New Connection got from the pool");

    connection.config.queryFormat = function (query, values) {
        if (!values) return query;
        return query.replace(/\:(\w+)/g, function (txt, key) {
            if (values.hasOwnProperty(key)) {
                return this.escape(values[key]);
            }
            return txt;
        }.bind(this));
    };
});

//-------------------------------------------------------------
// Common Modules
//-------------------------------------------------------------

var utilitiesCommon = require('./server/UtilitiesCommon.js')(logger);

//-------------------------------------------------------------
// Module local dependencies
//-------------------------------------------------------------

var securityServerService = require('./server/security/SecurityServerService.js')(poolConnections, logger, configCSM, q);
var securityServerController = require('./server/security/SecurityServerController.js')(express,poolConnections,logger,configCSM,q,utilitiesCommon);

var eventServerService  = require('./server/events/EventServerService.js')(poolConnections,logger,configCSM,q);
var eventServerController = require('./server/events/EventServerController.js')(express,poolConnections,logger,configCSM,eventServerService,q);

var craneServerService = require('./server/crane/CraneServerService.js')(express,poolConnections,logger,configCSM,q);
var craneServerController = require('./server/crane/CraneServerController.js')(express,poolConnections,logger,configCSM,q,eventServerService,craneServerService, utilitiesCommon);

var terminalServerService = require('./server/terminal/TerminalServerService.js')(express,poolConnections,logger,configCSM,q,securityServerService);
var terminalServerController = require('./server/terminal/TerminalServerController.js')(express,poolConnections,logger,configCSM,q,terminalServerService,utilitiesCommon);

var userServerController = require('./server/UserServerController.js')(express,poolConnections,configCSM,logger,q,validator,jwt);

var authenticationMiddleware = require('./server/AuthenticationMiddleware.js')(express,poolConnections,configCSM,logger,q);


app.use(configCSM.urls.events.main,authenticationMiddleware.ensureAuthorized);
app.use(configCSM.urls.terminals.main,authenticationMiddleware.ensureAuthorized);
app.use(configCSM.urls.cranes.main,authenticationMiddleware.ensureAuthorized);
app.use(configCSM.urls.security.main,authenticationMiddleware.ensureAuthorized);

app.use(configCSM.urls.events.main, eventServerController);
app.use(configCSM.urls.terminals.main, terminalServerController);
app.use(configCSM.urls.cranes.main, craneServerController);
app.use(configCSM.urls.users.main, userServerController);
app.use(configCSM.urls.security.main, securityServerController);


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