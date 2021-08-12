import express from 'express';
import appStore from 'app-store-scraper';
import { RatingsModelIOS } from '../model/ratings';
import { ReviewModelIOS } from '../model/review';
import { delay } from '../util/delay';
import { buildRatings, buildCountryRating } from '../util/ratingsBuilder';
import { buildReviews, buildCountryReviews } from '../util/reviewBuilder';
import { postToSlack } from '../util/slack';

const router = express.Router();

/* GET home page. */
router.get('/ratings', async (req, res, next) => {
  const { appCountryCodes, appStoreId, slackiOSUrl } = req.app.settings;
  const { dryrun = true } = req.query;
  console.log(`Running ratings with drynRun mode as ${dryrun}`);
  try {
    const allRatings = [];
    for (const code of appCountryCodes) {
      const ratings = await fetchAndBuildRatings(appStoreId, code);
      console.log(`--- Fetched ratings for country ${code} ---`);
      await saveRatingsData(appStoreId, code, ratings, dryrun);
      allRatings.push(buildCountryRating(code, ratings));
    }
    let data = '';
    if (allRatings.length > 0) {
      data = buildRatings(allRatings, false);
      await postToSlack(slackiOSUrl, data);
    }

    res.header('Content-Type', 'application/json');
    res.send(JSON.stringify(data, null, 4));
  } catch (error) {
    return next(error);
  }
});

router.get('/reviews', async (req, res, next) => {
  const { appCountryCodes, appStoreId, slackiOSUrl } = req.app.settings;
  const { dryrun } = req.query;
  console.log(`Running reviews with drynRun mode as ${dryrun}`);
  try {
    const finalReviews = [];
    for (const code of appCountryCodes) {
      const allCurrentReviews = [];
      // TODO: update page to 10
      for (let pageNo = 1; pageNo <= 10; ++pageNo) {
        console.log(`--- Calling country ${code} on page ${pageNo} ---`);
        const existingIds = await getExistingIds();
        const onlyNewReviews = await fetchAndBuildReviewDataSet(appStoreId, code, pageNo, existingIds);
        if (onlyNewReviews.length == 0) {
          console.log('No more new pages found or No new reviews, skipping to next country');
          break;
        } else {
          allCurrentReviews.push(...onlyNewReviews);
        }
        await delay(2000);
      }
      console.log(`Total new reviews for country <${code}> are ${allCurrentReviews.length}`);
      await saveNewReviews(appStoreId, code, allCurrentReviews, dryrun);
      finalReviews.push(allCurrentReviews);
      if (allCurrentReviews.length > 0) {
        const countryReviews = buildCountryReviews(code, allCurrentReviews);
        if (countryReviews.length > 0) {
          const data = buildReviews(code, countryReviews, false);
          await postToSlack(slackiOSUrl, data);
        }
      }
    }
    res.header('Content-Type', 'application/json');
    res.send(JSON.stringify(finalReviews, null, 4));
  } catch (error) {
    return next(error);
  }
});

async function saveRatingsData(appStoreId, code, ratingData, dryrun) {
  if (!dryrun) {
    const ratingModel = new RatingsModelIOS({
      appId: appStoreId,
      appVersion: ratingData.version,
      appUrl: ratingData.url,
      countryCode: code,
      totalScore: ratingData.score,
      totalReviews: ratingData.reviews,
      totalRatings: ratingData.ratings,
      rating1: ratingData.histogram['1'],
      rating2: ratingData.histogram['2'],
      rating3: ratingData.histogram['3'],
      rating4: ratingData.histogram['4'],
      rating5: ratingData.histogram['5']
    });
    await ratingModel.save();
    console.log(`Successful ratings save for country <${code}>`);
  }
}

async function fetchAndBuildRatings(appStoreId, code) {
  const ratingData = await appStore.app({
    id: appStoreId,
    ratings: true,
    country: code
  });
  return ratingData;
}

async function fetchAndBuildReviewDataSet(appStoreId, code, pageNo, existingIds) {
  const reviewData =
    (await appStore.reviews({
      id: appStoreId,
      page: pageNo,
      country: code
    })) || [];
  const onlyNewReviews = reviewData.filter((eachReview) => !existingIds.includes(eachReview.id));
  return onlyNewReviews;
}

async function getExistingIds() {
  const oldRatings = await ReviewModelIOS.find({}, { reviewId: 1, _id: 0 }).sort({ createdAt: -1 }).limit(500);
  const existingIds = oldRatings.map((eachRes) => {
    return eachRes.reviewId;
  });
  return existingIds;
}

async function saveNewReviews(appStoreId, code, reviews, dryrun) {
  if (reviews.length > 0 && !dryrun) {
    const allDBResponses = reviews.map((eachRes) => {
      return {
        appId: appStoreId,
        appVersion: eachRes.version,
        countryCode: code,
        reviewId: eachRes.id,
        score: eachRes.score,
        title: eachRes.title,
        content: eachRes.text,
        url: eachRes.url
      };
    });
    await ReviewModelIOS.insertMany(allDBResponses);
    console.log(`Successful reviews save for country <${code}> total: ${reviews.length}`);
  }
}

export default router;
