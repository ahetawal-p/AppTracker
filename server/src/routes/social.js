import express from 'express';
import moment from 'moment-timezone';
import querystring from 'querystring';
import TweetFetchModel from '../model/tweet';
import { search } from '../util/twitter';
import { postToSlack } from '../util/slack';

const router = express.Router();

/* Go social. */
router.get('/', async (req, res, next) => {
  try {
    const { slackiOSUrl, slackAndroidUrl } = req.app.settings;
    const currentSinceId = await getSinceId();
    // const tweets = await search();
    // TODO uncomment below
    const tweets = await search(currentSinceId);
    const tweetStatuses = tweets.statuses;
    const allTweets = [];
    for (const tweet of tweetStatuses) {
      allTweets.push({
        text: tweet.full_text,
        tweetUrl: `https://twitter.com/i/web/status/${tweet.id_str}`,
        tweetDate: moment(tweet.created_at, 'ddd MMM DD HH: mm: ss ZZ YYYY').tz('America/Los_Angeles').format('MMM Do'),
        userImage: tweet.user.profile_image_url_https,
        userHandle: `@${tweet.user.screen_name}`,
        userName: tweet.user.name,
        likes: tweet.favorite_count,
        media: tweet.entities.media
      });
    }
    const slackTweets = buildTweetSlackDisplay(allTweets);
    if (allTweets.length > 0) {
      await postToSlack(slackiOSUrl, slackTweets);
    }

    await saveNewSinceId(tweets, currentSinceId);
    res.header('Content-Type', 'application/json');
    res.send(JSON.stringify(slackTweets, null, 4));
  } catch (error) {
    return next(error);
  }
});

function buildTweetSlackDisplay(allTweets) {
  const payload = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: "*Let's see what :twitter: is _tweeting_ about #TrailheadGO:*"
        }
      }
    ]
  };
  for (const eachTweet of allTweets) {
    const displayTweet = {
      type: 'context',
      elements: [
        {
          type: 'image',
          image_url: eachTweet.userImage,
          alt_text: `${eachTweet.userName}`
        },
        {
          type: 'mrkdwn',
          text: `<${eachTweet.tweetUrl}|_*${eachTweet.userName}* ${eachTweet.userHandle} · ${eachTweet.tweetDate} · ${eachTweet.likes} :heart:_>`
        },
        {
          type: 'mrkdwn',
          text: `${eachTweet.text}\n\n`
        }
      ]
    };
    payload.blocks.push(displayTweet);
    if (eachTweet.media && eachTweet.media.length > 0) {
      const image = {
        type: 'image',
        image_url: eachTweet.media[0]['media_url_https'],
        alt_text: 'photo'
      };
      payload.blocks.push(image);
    }
    payload.blocks.push({
      type: 'divider'
    });
  }
  return payload;
}

async function getSinceId() {
  const sinceIds = await TweetFetchModel.findOne({}, { sinceId: 1, _id: 0 });
  return sinceIds ? sinceIds.sinceId : '';
}

async function saveNewSinceId(tweets, currentSinceId) {
  const searchMeta = tweets.search_metadata;
  const newSinceId = querystring.parse(searchMeta.refresh_url)['?since_id'];
  const updatedSinceId = await TweetFetchModel.findOneAndUpdate(
    { _id: 'modelSinceId' },
    { $set: { _id: 'modelSinceId', sinceId: newSinceId } },
    { upsert: true, new: true, runValidators: true }
  );
  console.log(updatedSinceId);
}

export default router;
