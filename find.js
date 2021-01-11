const Twitter = require('twitter');
const config = require('./credentials.js');
const client = new Twitter(config);
const username = process.argv[2]
const prompt = require('prompt-sync')({sigint: true})
const imageCompare = require('./image-compare')

let report, callbackOnFinish, isAWS
function start() {
    // First find the original account.
    const params = {
        screen_name: username
    } 
    client.get('users/lookup.json', params, (err, data, response) => {
        if (err) {
            console.dir(err);
            return;
        }
        const userObj = JSON.parse(response.body)[0]
        // Save the original user's profile picture.
        imageCompare.fetchAndSaveOriginalProfilePic(userObj.profile_image_url_https)
        // Now find imposters.
        findImposters(userObj, callbackOnFinish)
    })
}

// Determines whether the provider imposter is likely an imposter of the provided original account.
function checkIfImposter(imposter, original, callback) {
    if (imposter.screen_name === original.screen_name) {
        // This is the original account, so not an imposter.
        callback(false)
        return
    }
    imageCompare.hasSameProfilePic(imposter, (match) => {
        if (match) {
            // If the profile pictures match, then conclude its an imposter.
            callback(true)
            return
        }
        // Otherwise, see if the bio matches.
        // We look at the account bios. If greater than 50% of the words overlap, then we conclude it's
        // likely an imposter.
        const originalBioWords = original.description.split(' ')
        const imposterBioWords = imposter.description.split(' ')
        let matchedWordCount = 0
        for (const word of originalBioWords) {
            if (imposterBioWords.includes(word)) {
                matchedWordCount++
            }
        }
        if (matchedWordCount * 1.0 / originalBioWords.length > 0.5) {
            callback(true)
            return
        }
        callback(false)
        return
    })
}


function findImposters(userObj) {
    const params = {
        q: userObj.name
    } 
    client.get('users/search.json', params, async (err, data, response) => {
        if (err) {
            console.dir(err);
            return;
        }
        const possibleImposters = JSON.parse(response.body)
        const imposterResults = {}
        for (const possibleImposter of possibleImposters) {
            checkIfImposter(possibleImposter, userObj, (isImposter) => {
                imposterResults[possibleImposter.screen_name] = isImposter
            })
        }
        function waitForResultsAndContinue() {
            if (Object.keys(imposterResults).length === possibleImposters.length) {
                // Results are in.
                const imposters = Object.keys(imposterResults).filter(name => imposterResults[name])
                processImposters(imposters)

            } else {
                setTimeout(waitForResultsAndContinue, 50)
            }
        }
        waitForResultsAndContinue()
        
    })
}

function maybeReportImposters(names) {
    if (isAWS) {
        if (!report) {
            if (callbackOnFinish) callbackOnFinish()
            return
        }
    } else {
        prompt('\nProceed to report imposters?\n\n(press any key to continue, or CTRL-C to exit)\n')
    }
    const reportResults = {}
    function waitForAllReports() {
        if (Object.keys(reportResults).length === names.length) {
            console.log(`Done`)
            if (callbackOnFinish) callbackOnFinish()
        } else {
            setTimeout(waitForAllReports, 50)
        }
    }
    for (const name of names) {
        const params = {
            screen_name: name
        }
        client.post('users/report_spam.json', params, (err, data, response) => {
            reportResults[name] = err || data || response
            if (err) {
                console.dir(err);
                return;
            }
            console.log(`Reported ${name}`)
        })
    }
    waitForAllReports()
}

function processImposters(imposters) {
    console.log(`\nFound ${imposters.length} imposter accounts\n`)
    if (imposters.length == 0) return
    for (const name of imposters) {
        console.dir(name)
    }
    maybeReportImposters(imposters)
}

// Used if rurnning this as an AWS Lambda function.
exports.handler = (event, context, callback) => {
    report = event.report
    isAWS = !event.isLocal
    callbackOnFinish = callback
    start()
}

// Used if running as a local script.
if (require.main === module) {
    exports.handler({ isLocal: true })
}