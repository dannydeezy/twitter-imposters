const find = require('./find')

// Used if rurnning this as an AWS Lambda function.
exports.handler = async (event) => {
    await find.start(event.username, true, event.report)
}