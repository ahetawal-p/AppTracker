import moment from 'moment-timezone';
import numeral from 'numeral';
import { markets } from './markets';
import { APPSTORE_URL, PLAYSTORE_URL, buildAsOfTimeSection, addDivider } from './helpers';

export const buildCountryRating = (countryCode, ratingData) => {
  const countryRating = {
    type: 'context',
    elements: [
      {
        type: 'image',
        image_url: `https://www.countryflags.io/${countryCode}/flat/64.png`,
        alt_text: `${markets[countryCode]}`
      }
    ]
  };
  let stars = '';
  let allStars = '';
  for (let i = 0; i < 5; ++i) {
    stars += i <= Math.round(ratingData.score) ? '★' : '☆';
    allStars += `${5 - i} star: ${Math.round((ratingData.histogram[5 - i] / ratingData.ratings) * 100)}%\n`;
  }
  const displayedRating = Math.round(ratingData.score * 10) / 10;
  const totalRatings = numeral(ratingData.ratings).format('0,0');
  countryRating.elements.push({
    type: 'mrkdwn',
    text: `${stars}  *${displayedRating} out of 5* · _${totalRatings} ratings_ \n${allStars}`
  });
  return countryRating;
};

export const buildRatings = (allRatings, isAndroid) => {
  const url = isAndroid ? PLAYSTORE_URL.replace('{countryCode}', 'us') : APPSTORE_URL.replace('{countryCode}', 'us');
  const storeName = isAndroid ? 'PlayStore' : 'AppStore';
  const logo = isAndroid ? ':googleplay:' : ':appstore:';
  const payload = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Lets see ratings for ${logo} <${url}|TrailheadGO>: *`
        }
      }
    ]
  };
  if (allRatings.count == 0) {
    payload.blocks.push(buildNoRatings());
  } else {
    payload.blocks.push(...allRatings);
    payload.blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${buildAsOfTimeSection()}`
        }
      ]
    });
    payload.blocks.push(addDivider());
  }
  return payload;
};

function buildNoRatings() {
  const noRatingsSection = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `_Unable to fetch ratings_ :disappointed: \n${buildAsOfTimeSection()}`
    }
  };
  return noRatingsSection;
}
