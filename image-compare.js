const fs = require('fs')
const { imgDiff } = require("img-diff-js");
const child_process = require('child_process')
let originalImageLocation

if (!fs.existsSync('images')) {
    fs.mkdirSync('images')
}

function imageType(url) {
    const items = url.split('.')
    return items[items.length - 1]
}

function fetchAndSaveOriginalProfilePic(url) {
    originalImageLocation = `images/original.${imageType(url)}`
    child_process.execSync(`curl -s ${url} > ${originalImageLocation}`)
}

function hasSameProfilePic(userObj, callback) {
    const url = userObj.profile_image_url_https
    const imageLocation = `images/${userObj.screen_name}.${imageType(url)}`
    child_process.execSync(`curl -s ${url} > ${imageLocation}`)
    imgDiff({
        actualFilename: originalImageLocation,
        expectedFilename: imageLocation
    }).then(result => callback(result.isSameImage));
}

module.exports = { fetchAndSaveOriginalProfilePic, hasSameProfilePic }