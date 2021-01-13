# Find and Report Imposters of a Twitter Account

## Remote Usage (Easy)
Requires `curl`: (https://curl.haxx.se/download.html)

To see imposters:
```
curl -X POST https://imposters.dannydeezy.com -d '{"username":"pierre_rochard"}'
```
To report all imposters:
```
curl -X POST https://imposters.dannydeezy.com -d '{"username":"pierre_rochard", "report": true}'
```
You can also add additional search queries (for example a name or words in a bio) to help find imposters:
```
curl -X POST https://imposters.dannydeezy.com -d '{"username":"pierre_rochard", "queries": ["PierreRochard.com", "Pierre Rochard"], "report": true}'
```
## Local Usage (Hard)
Requires NodeJS
1. Create a [ Twitter developer account and create an App ](https://developer.twitter.com/). This is required in order to access the Twitter API.
2. Clone the repo and install
```
git clone https://github.com/dannydeezy/twitter-imposters.git
cd twitter-imposters
npm i
```
3. From your App's Details page, locate your API keys and access tokens, and create file in your `twitter-imposters` directory called `credentials.js` that looks like this (fill in the correct values):
```
module.exports = {
    consumer_key: '',
    consumer_secret: '',
    access_token_key: '',
    access_token_secret: ''
};
```
4. Run the app with the username of the legitimate account you want to find imposters for. Script will prompt you if you'd like to report them. Note this will create a folder at `/tmp/twitter-imposter-img` and save some profile pictures there.
```
node find.js pierre_rochard
```
You can also add additional search queries like this, which will search names and bios:
```
node find.js pierre_rochard '["PierreRochard.com","Pierre Rochard"]'
```