/**
 * Created by gal on 12/5/14.
 */
module.exports = function(express,connection,configCSM,logger,q,validator,jwt) {

    var loginRouter = express.Router();

    function getUserByEmail(userEmail) {

        if(userEmail && validator.isEmail(userEmail)){

            var query = "SELECT userFirstName,userLastName,userEmail,userToken FROM User " +
                "WHERE userEmail=:userEmail";

            connection.query(query, function(err, result) {

                if(err) {
                    logger.error("Error:" + JSON.stringify(err));
                    throw configCSM.error.DATABASE_ERROR;
                }
                else {

                    return result;
                }
            });
        }
    }

    loginRouter.get(configCSM.urls.users.login, function(req,res) {

        var userEmail = req.param('userEmail');
        var userPassword = req.param('userPassword');

        if (userEmail && userPassword && validator.isEmail(userEmail)) {

            var query = "SELECT userFirstName,userLastName,userEmail,userToken FROM User " +
                "WHERE userEmail=:userEmail AND userPassword = SHA2(:userPassword)";

            connection.query(query, function(err, result) {

                if(err) {
                    logger.error("Error:" + JSON.stringify(err));
                    res.json(configCSM.error.DATABASE_ERROR);
                }
                else {

                    if(result != null && result.length === 1) {

                        logger.debug("Query result:" + JSON.stringify(result));

                        logger.info("JSON Sent:" + JSON.stringify(result));
                        res.json(result);
                    }
                    else {

                        //User does not exist
                        logger.debug("Error Login:" + JSON.stringify(result));
                        res.json(configCSM.error.INVALID_USER);
                    }
                }
            });
        }
        else {
            logger.error("Error:" + userEmail + ":" + userPassword);
            res.json(configCSM.error.INVALID_INPUT);
        }
    });

    loginRouter.post(configCSM.urls.users.createUser, function(req,res){

        logger.debug("Create user");
        logger.info("JSON Received:"+ JSON.stringify(req.body));

        var newUser = req.body;

        if(newUser && validator.isAlphanumeric(newUser.userFirstName)
            && validator.isAlphanumeric(newUser.userLastName)) {

            logger.debug("User Ok to Insert:" + JSON.stringify(newUser));

            newUser.userToken = jwt.sign(newUser,configCSM.server.JWTSecret);

            var queryInsertRol = "INSERT INTO Rol (rolTypeId) VALUES (1)";
            var queryInsertUser = "INSERT INTO Users (userFirstName,userLastName,userEmail,userPassword,userToken,rolId) " +
                "VALUES (:userFirstName,:userLastName,:userEmail,:userPassword,:userToken,:rolId)";

            connection.beginTransaction(function(err) {

                if(err) {
                    logger.error("Error:" + JSON.stringify(err));
                    res.json(configCSM.error.DATABASE_ERROR);
                }

                q.ninvoke(connection,"query",queryInsertRol).then(function(result) {

                    logger.debug("Result Query Rol:" + JSON.stringify(result));
                    newUser.rolId = result[0].insertId;

                    logger.debug("New User to Insert:" + JSON.stringify(newUser));

                    return q.ninvoke(connection,"query",queryInsertUser,newUser);

                }).then(function(result){

                    logger.debug("Result Query User:" + JSON.stringify(result));




                    connection.commit(function(err) {
                        if (err) {
                            connection.rollback(function() {
                                logger.error("Error:" + JSON.stringify(err));
                                res.json(configCSM.error.DATABASE_ERROR);
                            });
                        }
                    });

                    logger.info("JSON Sent:" + JSON.stringify(result));
                    res.json(result);

                }).fail(function(err){
                    if(err) {
                        logger.error("Error:" + JSON.stringify(err));
                        res.json(configCSM.error.DATABASE_ERROR);
                    }
                });

            });
        }
        else {

            logger.error("Error:" + JSON.stringify(newUser));
            res.json(configCSM.error.INVALID_INPUT);
        }
    });

    loginRouter.post(configCSM.urls.users.changePassword, function(req,res){

        logger.debug("Change User Password");
        logger.info("JSON Received:"+ JSON.stringify(req.body));

        var userPasswords = req.body;

        var queryPassword = "UPDATE User SET userPassword = SHA2(:newPassword) WHERE userEmail = :userEmail";

        connection.query(queryPassword, userPasswords, function(err,result){

            if(err) {
                logger.error("Error:" + JSON.stringify(err));
                res.json(configCSM.error.DATABASE_ERROR);
            }
            else {
                //Get the new User
                try {
                    var user =  getUserByEmail(userPasswords.userEmail);
                    logger.info("JSON Sent:" + JSON.stringify(user));
                    res.json(user);
                }
                catch (err) {
                    logger.info("JSON Sent:" + JSON.stringify(err));
                    res.json(err);
                }
            }
        });

    });


    return loginRouter;
};

