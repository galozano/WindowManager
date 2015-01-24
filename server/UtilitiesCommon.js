/**
 * Created by gal on 1/24/15.
 */
module.exports = function(logger) {

    var utilities = { };

    utilities.generateResponse = function generateResponse(data,status) {

        var response = {
            status:status,
            date:(new Date()).toJSON(),
            data:data
        };

        logger.info("JSON Sent:" + JSON.stringify(response));
        return response;
    };

    return utilities;

};