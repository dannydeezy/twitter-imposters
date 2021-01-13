const find = require('./find')

// Used if rurnning this as an AWS Lambda function.
exports.handler = async (event) => {
    console.log(JSON.stringify(event))
    return find.start(event.username, event.queries, true, event.report)
}