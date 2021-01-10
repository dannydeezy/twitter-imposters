const Twitter = require('twitter');
const config = require('./credentials.js');
const client = new Twitter(config);
const username = process.argv[2]
const prompt = require('prompt-sync')({sigint: true});

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
        // Now find imposters.
        findImposters(userObj)
    })
}


function findImposters(userObj) {
    const params = {
        q: userObj.name
    } 
    client.get('users/search.json', params, (err, data, response) => {
        if (err) {
            console.dir(err);
            return;
        }
        const possibleImposters = JSON.parse(response.body)
        const imposters = possibleImposters.filter(obj => obj.name == userObj.name && obj.screen_name !== userObj.screen_name)
        processImposters(imposters)
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
    console.log(`Found ${imposters.length} imposter accounts:\n`)
    const imposterNames = imposters.map(it => it.screen_name)
    for (const name of imposterNames) {
        console.log(name)
    }
    maybeReportImposters(imposterNames)
}

start()