import { markets } from './markets';
import { APPSTORE_URL, PLAYSTORE_URL, buildAsOfTimeSection, addDivider } from './helpers';

export const buildCountryReviews = (countryCode, reviewsData) => {
  const displayData = [];
  const countryAsOfSection = {
    type: 'context',
    elements: [
      {
        type: 'image',
        image_url: `https://www.countryflags.io/${countryCode}/flat/64.png`,
        alt_text: `${markets[countryCode]}`
      },
      {
        type: 'mrkdwn',
        text: `${buildAsOfTimeSection()}`
      }
    ]
  };
  displayData.push(countryAsOfSection);

  for (const eachReview of reviewsData) {
    let stars = '';
    for (let i = 0; i < 5; ++i) {
      stars += i < eachReview.score ? '★' : '☆';
    }
    const linkText = eachReview.title ? eachReview.title : eachReview.text;
    const detailText = eachReview.title ? eachReview.text : '';
    const countryReviewSection = {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${stars}\n<${eachReview.url}|${linkText}>\n${detailText}`
      }
    };
    displayData.push(countryReviewSection);
  }
  return displayData;
};

export const buildReviews = (countryCode, allReviews, isAndroid) => {
  const url = isAndroid
    ? PLAYSTORE_URL.replace('{countryCode}', countryCode)
    : APPSTORE_URL.replace('{countryCode}', countryCode);
  const storeName = isAndroid ? 'PlayStore' : 'AppStore';
  const logo = isAndroid ? ':googleplay:' : ':appstore:';
  const payload = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Lets see what ${logo} <${url}|TrailheadGO> reviews are saying: *`
        }
      }
    ]
  };
  const slicedArray = allReviews.slice(0, 45);
  payload.blocks.push(...slicedArray);
  payload.blocks.push(addDivider());
  return payload;
};
