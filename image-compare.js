const fs = require('fs')
const request = require('request-promise')
const { imgDiff } = require("img-diff-js");
const imageFolder = `/tmp/twitter-imposter-img`
let originalImage, originalImageLocation

if (!fs.existsSync(imageFolder)) {
    fs.mkdirSync(imageFolder)
}

function imageType(url) {
    const items = url.split('.')
    return items[items.length - 1]
}

async function fetchAndSaveOriginalProfilePic(url) {
    originalImageLocation = `${imageFolder}/original.${imageType(url)}`
    originalImage = await request({ url, encoding: null })
    fs.writeFileSync(originalImageLocation, Buffer.from(originalImage, 'utf8'))
}

async function hasSameProfilePic(userObj) {
    const url = userObj.profile_image_url_https
    const imposterImage = await request({ url, encoding: null })
    const imageLocation = `${imageFolder}/${userObj.screen_name}.${imageType(url)}`
    fs.writeFileSync(imageLocation, Buffer.from(imposterImage, 'utf8'))
    return new Promise((resolve, reject) => {
        imgDiff({	
            actualFilename: originalImageLocation,	
            expectedFilename: imageLocation,
            options: {
                threshold: 0.7
            }
        }).then(result => { resolve(result.imagesAreSame)})
    })
}

module.exports = { fetchAndSaveOriginalProfilePic, hasSameProfilePic }