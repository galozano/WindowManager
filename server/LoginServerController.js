/**
 * Created by gal on 12/5/14.
 */
module.exports = function(express,connection,configCSM,logger,q,validator,jwt) {

    var loginRouter = express.Router();

    function getUserByEmail(userEmail,callback) {

        if(userEmail && validator.isEmail(userEmail)){

            var userEmailJSON = {userEmail:userEmail};

            var query = "SELECT userFirstName,userLastName,userEmail,userToken,rolId FROM Users " +
                "WHERE userEmail = :userEmail";

            connection.query(query, userEmailJSON, function(err, result) {

                if(err) {
                    logger.error("Error:" + JSON.stringify(err));
                    callback(configCSM.errors.DATABASE_ERROR);
                }
                else {

                    //There is a valid result
                    if(result[0])
                        callback(result[0]);
                    else
                        callback(configCSM.errors.DATABASE_ERROR);
                }
            });
        }
    }

    function verifyUserLoginPassword(email,password,callback) {

        logger.debug("Verify User Login & Password");

        if (email && password && validator.isEmail(email)) {

            logger.debug("Email and password are ok:" + email + ":" + password);

            var query = "SELECT userFirstName,userLastName,userEmail,userToken FROM Users " +
                "WHERE userEmail=:userEmail AND userPassword = SHA2(:userPassword,256)";

            var loginJSON = {
                userEmail:email,
                userPassword:password
            };

            connection.query(query,loginJSON, function(err, result) {

                if(err) {
                    logger.error("Error:" + JSON.stringify(err));
                    callback(configCSM.errors.DATABASE_ERROR);
                }
                else {

                    //User exist and user found is sent
                    if(result != null && result.length === 1) {

                        logger.debug("Query result:" + JSON.stringify(result));
                        callback(result[0]);
                    }
                    else {

                        //User does not exist
                        logger.debug("Error Login:" + JSON.stringify(result));
                        callback(configCSM.errors.INVALID_USER);
                    }
                }
            });
        }
        else {
            logger.error("Error:" + email + ":" + password);
            callback(configCSM.errors.INVALID_INPUT);
        }
    }

    loginRouter.post(configCSM.urls.users.login, function(req,res) {

        logger.debug("Login");
        var loginJson = req.body;

        logger.debug("Info Received:" + JSON.stringify(loginJson));

        //Verify User login & password to see if exist on database
        verifyUserLoginPassword(loginJson.userEmail,loginJson.userPassword,function(result) {
            logger.info("JSON Sent:" + JSON.stringify(result));
            res.json(result);
        });
    });

    loginRouter.post(configCSM.urls.users.createUser, function(req,res){

        logger.debug("Create user");
        logger.info("JSON Received:"+ JSON.stringify(req.body));

        var newUser = req.body;

        if(newUser && validator.isAlphanumeric(newUser.userFirstName)
            && validator.isAlphanumeric(newUser.userLastName)) {

            logger.debug("User Ok to Insert:" + JSON.stringify(newUser));

            //Sign the user and create a token
            newUser.userToken = jwt.sign(newUser,configCSM.server.JWTSecret);

            var queryInsertRol = "INSERT INTO Rol (rolTypeId) VALUES (1)";
            var queryInsertUser = "INSERT INTO Users (userFirstName,userLastName,userEmail,userPassword,userToken,rolId) " +
                "VALUES (:userFirstName,:userLastName,:userEmail,SHA2(:userPassword,256),:userToken,:rolId)";

            connection.beginTransaction(function(err) {

                if(err) {
                    logger.error("Error:" + JSON.stringify(err));
                    res.json(configCSM.errors.DATABASE_ERROR);
                }

                q.ninvoke(connection,"query",queryInsertRol).then(function(result) {

                    logger.debug("Result Query Rol:" + JSON.stringify(result));
                    newUser.rolId = result[0].insertId;
                    logger.debug("New User to Insert:" + JSON.stringify(newUser));

                    return q.ninvoke(connection,"query",queryInsertUser,newUser);

                }).then(function(result){

                    logger.debug("Result Query User:" + JSON.stringify(result));

                    getUserByEmail(newUser.userEmail, function(result){

                        logger.debug("Result Query Get User:" + JSON.stringify(result));

                        //Commit the transaction
                        connection.commit(function(err) {
                            if (err) {
                                connection.rollback(function() {
                                    logger.error("Error:" + JSON.stringify(err));
                                    res.json(configCSM.errors.DATABASE_ERROR);
                                });
                            }
                        });

                        logger.info("JSON Sent:" + JSON.stringify(result));
                        res.json(result);
                    });
                }).fail(function(err){
                    if(err) {
                        logger.error("Error:" + JSON.stringify(err));
                        res.json(configCSM.errors.DATABASE_ERROR);
                    }
                });
            });
        }
        else {
            //There is an error the input data
            logger.error("Error:" + JSON.stringify(newUser));
            res.json(configCSM.error.INVALID_INPUT);
        }
    });

    loginRouter.post(configCSM.urls.users.changePassword, function(req,res){

        logger.debug("Change User Password");
        logger.info("JSON Received:"+ JSON.stringify(req.body));

        var userJSON = req.body;

        var userPasswords = {
            userEmail:userJSON.userEmail,
            newPassword:userJSON.newPassword
        };

        var updateQuery = "UPDATE Users SET userPassword = SHA2(:newPassword,256) WHERE userEmail = :userEmail";

        verifyUserLoginPassword(userJSON.userEmail,userJSON.oldPassword, function(result){

            if(!result.code) {
                connection.query(updateQuery, userPasswords, function(err,result){

                    if(err) {
                        logger.error("Error:" + JSON.stringify(err));
                        res.json(configCSM.error.DATABASE_ERROR);
                    }
                    else {

                        getUserByEmail(userPasswords.userEmail,function(result){
                            logger.info("JSON Sent:" + JSON.stringify(result));
                            res.json(result);
                        });
                    }
                });
            }
            else {
                logger.info("JSON Sent:" + JSON.stringify(result));
                res.json(result);
            }

        });
    });

    return loginRouter;
};

