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

//Mongoose
mongoose.connect(app.get('mongoConnection'), function(err)
{
    if(!err)
    {
        console.log("Connected to Mongo");
    }
    else
        throw err;
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

    User.findOne( { email: email} ,function(err,user) {

        //Manage any error from the query
        if(err) {
            console.log(err);
            res.render('login.html', { message: 'There was an unexpected error'});
        }

        if(!user) {
            //User does not exist
            res.render('login.html', { message: 'Username is incorrect'});
        }
        else if(!user.validPassword(password)) {
            //Password does not match
            res.render('login.html', { message: 'Password is incorrect'});
        }
        else {
            //User is Ok.. Set session and redirect to main page
            session.user = user._id;
            res.redirect('/');

        }
    });
});

app.get('/',authenticationMiddleware, function (req,res) {

    res.render('index2.html');
});

//-------------------------------------------------------------
// Web Services
//-------------------------------------------------------------

app.get('/events', function (req, res) {

    //Find all events and returns them as a JSON
    Event.find().exec(function(error, data) {
        res.json(data);
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