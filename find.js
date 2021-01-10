const Twitter = require('twitter');
const config = require('./credentials.js');
const client = new Twitter(config);
const username = process.argv[2]
const prompt = require('prompt-sync')({sigint: true})
const imageCompare = require('./image-compare')

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
        findImposters(userObj)
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
                setTimeout(waitForResultsAndContinue, 500)
            }
        }
        waitForResultsAndContinue()
        
    })
}

function maybeReportImposters(names) {
    prompt('\nProceed to report imposters?\n\n(press any key to continue, or CTRL-C to exit)\n')
    for (const name of names) {
        const params = {
            screen_name: name
        }
        client.post('users/report_spam.json', params, (err, data, response) => {
            if (err) {
                console.dir(err);
                return;
            }
            console.log(`Reported ${name}`)
        })
    }
}

function processImposters(imposters) {
    console.log(`\nFound ${imposters.length} imposter accounts\n`)
    if (imposters.length == 0) return
    const imposterNames = imposters.map(it => it.screen_name)
    for (const name of imposters) {
        console.dir(name)
    }
    maybeReportImposters(imposterNames)
}

start()