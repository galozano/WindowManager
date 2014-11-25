/**
 * Created by gal on 11/9/14.
 */

//-------------------------------------------------------------
// Module dependencies  & Configuration
//-------------------------------------------------------------

var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var session = require('express-session');
var mysql = require('mysql');

var app = express();

app.set('port', 3000);
app.set('mongoConnection', 'mongodb://localhost/ServiceManager');

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

////Mongoose
//mongoose.connect(app.get('mongoConnection'), function(err)
//{
//    if(!err)
//    {
//        console.log("Connected to Mongo");
//    }
//    else
//        throw err;
//});

//Mysql var
connection = mysql.createConnection({
    host    : 'localhost',
    user    : 'csm',
    password: 'CSM.2014',
    database: 'CSM'
});

//-------------------------------------------------------------
// Mongoose Schema Model
//-------------------------------------------------------------

//Events
var eventsSchema = new mongoose.Schema({

    eventName: {type:String, required:true},
    arrivingTime: {type:String, required:true},
    duration: {type:Number, required:true},
    eventStart: {type:Number, required:true},
    eventLength: {type:Number, required:true},
    day: {type:Number, required:true},
    created: {type: Date, default: Date.now}
});

var Event = mongoose.model('Event',eventsSchema);


//User
var userSchema = new mongoose.Schema({

    name: {type:String, required:true, trim:true},
    email: {type:String, required: true, trim: true, lowercase:true, unique: true},
    password: {type:String, required: true },
    created: {type: Date, default: Date.now}
});

userSchema.methods.validPassword = function(password) {

    if (this.password == password){
        return true;
    }
    return false;
};

var User = mongoose.model('User', userSchema);

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
// Routes
//-------------------------------------------------------------

app.get('/login', function(req,res) {

    res.render('login.html', { message: ''});
});

app.post('/login',function(req,res)
{
    var session = req.session;
    var email = req.param('email');
    var password = req.param('password');

    var query = "SELECT email FROM User WHERE email=" + connection.escape(email) + " AND password="+ connection.escape(password)  +"";

    console.log(query);

    connection.query(query, function(err, rows) {
         //Manage any error from the query
         if(err) {

             console.log(err);
             res.render('login.html', { message: 'There was an unexpected error'});
         }
         else {

             if(rows != null && rows.length === 1) {

                 console.log("User OK");

                 //User is Ok.. Set session and redirect to main page
                 session.user = rows[0].userId;
                 res.redirect("/");
             }
             else {
                 //User does not exist
                 console.log("Error login");
                 res.render('login.html', { message: 'Email is incorrect'});
             }

             console.log(rows.length);
             console.log("OK!");
         }
    });
});

app.get('/', function (req,res) {

    res.render('index2.html');
});

//-------------------------------------------------------------
// Web Services
//-------------------------------------------------------------

app.get('/events', function (req, res) {

    var query = "SELECT eventId,arrivingTime,day,duration,eventLength,eventName,eventStart FROM Events";
    console.log(query);

    connection.query(query, function(err, rows) {
        if(err) {
            console.log(err);
            res.json("{ message: 'There was an unexpected error'}");

        }
        else
        {
            console.log(rows);
            res.json(rows);
        }

    });
});

app.post('/addEvent',function(req,res) {

    console.log("Add event");
    console.log(req.body);

    var newEvent = req.body;
    var event = new Event(newEvent);

    event.save(function(error,data)
    {
        if(error)
        {
            console.log(error);
            res.json({error:"SME01:Could not saved the new event"});
        }
        else
        {
            res.json(data);
        }
    });
});

app.post('/editEvent', function(req,res) {

    console.log("Edit event");
    console.log(req.body);

    var editEvent = req.body;
    var eventId = editEvent.id;

    Event.findByIdAndUpdate(eventId,editEvent,function(err,doc) {

        if(err)
            console.log(err);

    });
});

app.post('/deleteEvent',function(req,res) {

    console.log("Delete event");
    console.log(req.body);

    var deleteEvent = req.param("id");
    console.log("Delete:" + deleteEvent);

    Event.findByIdAndRemove(deleteEvent,function(err,doc) {

        if(err)
            console.log(err);
    });
});

//-------------------------------------------------------------
// Main Start Server
//-------------------------------------------------------------

var server = app.listen(app.get('port'), function() {

    var host = server.address().address;
    var port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);
});