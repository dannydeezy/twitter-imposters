const Twitter = require('twitter');
const config = require('./credentials.js');
const client = new Twitter(config);
const prompt = require('prompt-sync')({sigint: true})
const imageCompare = require('./image-compare')

let username, report, callbackOnFinish, isAWS
async function start(_username, _isAWS, _report, _callback) {
    username = _username
    isAWS = _isAWS
    report = _report
    callbackOnFinish = _callback
    // First find the original account.
    const params = {
        screen_name: username
    } 
    const userObj = await new Promise((resolve, reject) => {
        client.get('users/lookup.json', params, (err, data, response) => {
            if (err) {
                console.dir(err);
                reject(err)
                return;
            }
            const userObj = JSON.parse(response.body)[0]
            resolve(userObj)
        })
    })
    // Save the original user's profile picture.
    await imageCompare.fetchAndSaveOriginalProfilePic(userObj.profile_image_url_https)
    // Now find imposters.
    const results = await findImposters(userObj, callbackOnFinish)
    return results
}

// Determines whether the provider imposter is likely an imposter of the provided original account.
async function isImposter(imposter, original) {
    if (imposter.screen_name === original.screen_name) {
        // This is the original account, so not an imposter.
        return false
    }
    if (await imageCompare.hasSameProfilePic(imposter)) {
        // If the profile pictures match, then conclude its an imposter.
        return true
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
        return true
    }
    return false
}


async function findImposters(userObj) {
    const params = {
        q: userObj.name
    }
    const possibleImposters = await new Promise((resolve, reject) => {
        client.get('users/search.json', params, async (err, data, response) => {
            if (err) {
                console.dir(err)
                reject(err)
                return;
            }
            const possibleImposters = JSON.parse(response.body)
            resolve(possibleImposters)
        })
    })
    const imposters = []
    for (const possibleImposter of possibleImposters) {
        if (await isImposter(possibleImposter, userObj)) {
            imposters.push(possibleImposter)
        }
    }
    return await processImposters(imposters.map(it => it.screen_name))
}

async function maybeReportImposters(names) {
    if (isAWS) {
        if (!report) {
            return `Found imposters: ${names.join(', ')}`
        }
    } else {
        prompt('\nProceed to report imposters?\n\n(press any key to continue, or CTRL-C to exit)\n')
    }
    const reportResults = {}
    for (const name of names) {
        const params = {
            screen_name: name
        }
        reportResults[name] = await new Promise((resolve, reject) => {
            client.post('users/report_spam.json', params, (err, data, response) => {
                if (err) {
                    console.dir(err);
                    resolve('Error reporting this user (likely rate-limited). Try again later.')
                    return;
                }
                console.log(`Reported ${name}`)
                resolve('Reported')
            })
        })
    }
    return `Found and reported imposters: ${Object.keys(reportResults).join(', ')}`
}

async function processImposters(imposters) {
    console.log(`\nFound ${imposters.length} imposter accounts\n`)
    if (imposters.length == 0) return "Found 0 imposter accounts"
    for (const name of imposters) {
        console.dir(name)
    }
    return maybeReportImposters(imposters)
}

module.exports = { start, isAWS, callbackOnFinish, username, report }

// Used if running as a local script.
if (require.main === module) {
    start(process.argv[2])
}
