/**
 * Created by gal on 11/9/14.
 */

//-------------------------------------------------------------
// Module dependencies  & Configuration
//-------------------------------------------------------------

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var session = require('express-session');
var mysql = require('mysql');
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
app.use(session({secret: '65736583GGHUYTFGJI8',
    saveUninitialized: true,
    resave: true}));


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
// Middleware
//-------------------------------------------------------------

function authenticationMiddleware(req,res,next)
{
    var session = req.session;

    //Check if the user is logged in
    if(!session.user) {
        res.redirect('/login');
    }

    next();
}

//-------------------------------------------------------------
// Module local dependencies
//-------------------------------------------------------------

var eventServerController = require('./server/EventServerController.js')(express,connection,logger,configCSM);
var terminalServerController = require('./server/TerminalServerController.js')(express,connection,logger,configCSM);
var loginServerController = require('./server/LoginServerController.js')(express,connection,configCSM);

app.use(configCSM.urls.events.main,eventServerController);
app.use(configCSM.urls.terminals.main,terminalServerController);
app.use('/',loginServerController);

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