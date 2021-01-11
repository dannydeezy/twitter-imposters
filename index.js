const find = require('./find')

// Used if rurnning this as an AWS Lambda function.
exports.handler = async (event) => {
    return find.start(event.username, true, event.report)
}