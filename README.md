# Find and Report Imposters of a Twitter Account

## Usage
1. Create a [ Twitter developer account and create an App ](https://developer.twitter.com/). Do this with the account that you want to be doing the retweeting from.
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
4. Run the app with the username of the legitimate account you want to find imposters for
```
node find.js pierre_rochard
```
