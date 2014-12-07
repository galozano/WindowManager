/**
 * Created by gal on 11/9/14.
 */


    //TODO: Organizar los routes en otro archivo y servicio en otro
    //TODO: Documentar todo para que quede bien
    //TODO: poner un logger bueno --Morga
    //TODO:Hacer config file con NODE_ENV
    //TODO:Terminar de organizar todas las dependencies de package.json
    //TODO: Crear function que crea el mensaje del error
    //TODO: No enviar la informacion como la da la base de datos, tener una servicio de cambio de informacion

//-------------------------------------------------------------
// Module dependencies  & Configuration
//-------------------------------------------------------------

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var session = require('express-session');
var mysql = require('mysql');
var logger = require('./server/conf/logger.js');

//-------------------------------------------------------------
// Initial Configuration
//-------------------------------------------------------------

var app = express();

app.set('port', 3000);
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

connection = mysql.createConnection({
    host    : 'localhost',
    user    : 'csm',
    password: 'CSM.2014',
    database: 'CSM'
});

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

var eventServerController = require('./server/EventServerController.js')(express,connection,logger);
var loginServerController = require('./server/LoginServerController.js')(express,connection);

app.use('/',eventServerController);
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