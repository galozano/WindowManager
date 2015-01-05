/**
 * Created by gal on 12/6/14.
 */

module.exports = function(express,connection,logger,configCSM,q) {

    var terminalsRouter = express.Router();

    terminalsRouter.get(configCSM.urls.terminals.getTerminals, function(req, res) {

        var query = "SELECT terminalId, terminalName FROM Terminals";

        connection.query(query,function(err, result) {
            if(err) {
                logger.error("ERROR:" + err);
                res.json(configCSM.errors.DATABASE_ERROR);
            }
            else {
                logger.info("JSON Sent:" + JSON.stringify(result));
                res.json(result);
            }
        });

    });

    terminalsRouter.get(configCSM.urls.terminals.getTerminal+'/:terminalId', function(req,res) {

        var jsonResponse = "";

        var query1 = "SELECT T.terminalId,T.terminalName, TCS.terminalConfigSchemaName, SUM(berthLength) totalLength FROM " +
            "Terminals T, TerminalConfigSchema TCS, Berths B " +
            "WHERE T.terminalConfigSchemaId = TCS.terminalConfigSchemaId " +
            "AND   B.terminalConfigSchemaId = TCS.terminalConfigSchemaId " +
            "AND T.terminalId = :terminalId " +
            "GROUP BY TCS.terminalConfigSchemaName";

        //Get all the berths of the terminal
        var query2 = "SELECT B.berthId, B.berthName, B.berthLength, B.berthSequence, B.berthStart FROM " +
            "Terminals T, TerminalConfigSchema TCS, Berths B " +
            "WHERE T.terminalConfigSchemaId = TCS.terminalConfigSchemaId " +
            "AND   B.terminalConfigSchemaId = TCS.terminalConfigSchemaId " +
            "AND T.terminalId = :terminalId " +
            "ORDER BY B.berthSequence";

        //Get all the cranes of the terminal
        var query3 = "SELECT C.craneId,C.craneName " +
            "FROM Terminals T,CraneConfigSchema CCS,Cranes C " +
            "WHERE T.craneConfigSchemaId = CCS.craneConfigSchemaId " +
            "AND CCS.craneConfigSchemaId = C.craneConfigSchemaId " +
            "AND T.terminalId = :terminalId";


        logger.info("Terminal ID Requested:" + req.params.terminalId);

        if(req.params.terminalId && /[0-9]+/.test(req.params.terminalId)) {

            var terminalId = req.params.terminalId;
            var terminalIdJson = {terminalId:terminalId};

            q.ninvoke(connection, "query", query1,terminalIdJson).then(function(result) {

                logger.debug("Result thrown by query 1:" + JSON.stringify(result));
                jsonResponse = result[0][0];
                logger.debug("Response Construction 1:" + JSON.stringify(jsonResponse));
                return q.ninvoke(connection, "query", query2,terminalIdJson);

            }).then(function(result){
                logger.debug("Result thrown by query 2:" + JSON.stringify(result));
                jsonResponse.berths = result[0];

                logger.debug("Response Construction 2:" + JSON.stringify(jsonResponse));
                return q.ninvoke(connection, "query", query3,terminalIdJson);

            }).then(function(result){
                logger.debug("Result thrown by query 3:" + JSON.stringify(result));
                jsonResponse.cranes = result[0];

                logger.debug("Response Construction 3:" + JSON.stringify(jsonResponse));
                logger.info("JSON sent:" + JSON.stringify(jsonResponse));
                res.json(jsonResponse);

            }).fail(function(err){
                if(err) {
                    logger.error("ERROR:" + err);
                    res.json(configCSM.errors.DATABASE_ERROR);
                }
            });
        }
        else {
            logger.warn("Got invalid terminal id");
            res.json(configCSM.errors.TERMINAL_INVALID_ID);
        }
    });

    terminalsRouter.post(configCSM.urls.terminals.deleteTerminal,function(req,res) {

        var query = "DELETE FROM Terminals WHERE terminalId = :terminalId";

        connection.query(query,function(err, result) {
            if(err) {
                logger.error("ERROR:" + err);
                res.json(configCSM.errors.DATABASE_ERROR);
            }
            else {
                logger.info("JSON Sent:" + JSON.stringify(result));
                res.json(result);
            }
        });
    });

    terminalsRouter.get('/getConfigSchemas', function(req,res) {

    });

    //Create terminal configuration Schema
    terminalsRouter.post('/newConfigSchema', function (req,res) {

    });

    //Delete configuration Schema

    //Add new terminal

    return terminalsRouter;

};