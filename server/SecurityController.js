/**
 * Created by gal on 1/25/15.
 */
module.exports = function(express,poolConnections,logger,configCSM,q, utilitiesCommon) {

    var securityRouter = express.Router();

    securityRouter.post("/addTerminalPermission", function(req, res) {

        logger.debug("JSON received:" + JSON.stringify(req.body));

        var insertSQL = "";


        poolConnections.getConnection(function(err, connection) {

            if (err) {
                logger.error("Pool Error:" + JSON.stringify(err));
                res.json(configCSM.errors.DATABASE_ERROR);
                return;
            }







        });


    });


};