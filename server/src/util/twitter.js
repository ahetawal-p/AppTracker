import Twitter from 'twitter';
import { CONSUMER_KEY, CONSUMER_SECRET, BEARER_TOKEN } from '../setup';

const client = new Twitter({
  consumer_key: CONSUMER_KEY,
  consumer_secret: CONSUMER_SECRET,
  bearer_token: BEARER_TOKEN
});

export const search = async (sinceId) => {
  try {
    const tweets = await client.get('search/tweets', {
      q: '#trailheadgo min_faves:10',
      result_type: 'recent',
      since_id: sinceId,
      count: 40,
      tweet_mode: 'extended'
    });
    return tweets;
  } catch (error) {
    console.log(error);
  }
};
