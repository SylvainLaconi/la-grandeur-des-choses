"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const twitter_api_v2_1 = require("twitter-api-v2");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const appKey = process.env.TWITTER_API_KEY;
const appSecret = process.env.TWITTER_API_KEY_SECRET;
const accessToken = process.env.TWITTER_ACCESS_TOKEN;
const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
console.log(appKey, appSecret, accessToken, accessSecret);
const client = new twitter_api_v2_1.TwitterApi({
    appKey: appKey,
    appSecret: appSecret,
    accessToken: accessToken,
    accessSecret: accessSecret,
});
async function main() {
    await client.v2.tweet('Hello from La Grandeur Des Choses!');
}
main();
