const find = require('./find')

// Used if rurnning this as an AWS Lambda function.
exports.handler = (event, context, callback) => {
    find.start(event.username, true, event.report, callback)
}