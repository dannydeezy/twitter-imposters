const fs = require('fs')
const { imgDiff } = require("img-diff-js");
const child_process = require('child_process')
const request = require('request-promise')
const imageFolder = `/tmp/twitter-imposter-img`
let originalImage

if (!fs.existsSync(imageFolder)) {
    fs.mkdirSync(imageFolder)
}

function imageType(url) {
    const items = url.split('.')
    return items[items.length - 1]
}

async function fetchAndSaveOriginalProfilePic(url) {
    originalImageLocation = `${imageFolder}/original.${imageType(url)}`
    originalImage = await request(url)
}

async function hasSameProfilePic(userObj, callback) {
    const url = userObj.profile_image_url_https
    const imposterImage = await request(url)
    return imposterImage === originalImage
}

module.exports = { fetchAndSaveOriginalProfilePic, hasSameProfilePic }