/**
 * Created by gal on 12/5/14.
 */


module.exports = function(express,connection) {

    var loginRouter = express.Router();

    loginRouter.get('/login', function(req,res) {

        res.render('login.html', { message: ''});
    });

    loginRouter.post('/login',function(req,res)
    {
        var session = req.session;
        var email = req.param('email');
        var password = req.param('password');

        var query = "SELECT email FROM User WHERE email=" + connection.escape(email) + " AND password="+ connection.escape(password)  +"";

        console.log(query);

        connection.query(query, function(err, rows) {
            //Manage any error from the query
            if(err) {
                //TODO:Poner los codigos de los errores en las respuestas de los mensajes
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
                    //TODO:Poner los codigos de los errores en las respuestas de los mensajes
                    res.render('login.html', { message: 'Email is incorrect'});
                }

                console.log(rows.length);
                console.log("OK!");
            }
        });
    });

    return loginRouter;
};

