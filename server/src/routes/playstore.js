import express from 'express';
import playStore from 'google-play-scraper';
import { RatingsModelAndroid } from '../model/ratings';
import { ReviewModelAndroid } from '../model/review';
import { delay } from '../util/delay';
import { buildRatings, buildCountryRating } from '../util/ratingsBuilder';
import { buildReviews, buildCountryReviews } from '../util/reviewBuilder';
import { postToSlack } from '../util/slack';

const router = express.Router();

/* GET home page. */
router.get('/ratings', async (req, res, next) => {
  const { playCountryCodes, playStoreId, slackAndroidUrl } = req.app.settings;
  const { dryrun = true } = req.query;
  console.log(`Running ratings with drynRun mode as ${dryrun}`);
  try {
    const allRatings = [];
    for (const code of playCountryCodes) {
      const ratings = await fetchAndBuildRatings(playStoreId, code);
      console.log(`--- Fetched ratings for country ${code} ---`);
      await saveRatingsData(playStoreId, code, ratings, dryrun);
      allRatings.push(buildCountryRating(code, ratings));
    }
    let data = '';
    if (allRatings.length > 0) {
      data = buildRatings(allRatings, true);
      await postToSlack(slackAndroidUrl, data);
    }

    res.header('Content-Type', 'application/json');
    res.send(JSON.stringify(data, null, 4));
  } catch (error) {
    return next(error);
  }
});

router.get('/reviews', async (req, res, next) => {
  const { playCountryCodes, playStoreId, slackAndroidUrl } = req.app.settings;
  const { dryrun } = req.query;
  console.log(`Running reviews with drynRun mode as ${dryrun}`);
  try {
    const finalReviews = [];
    for (const code of playCountryCodes) {
      console.log(`--- Calling country ${code} ---`);
      const existingIds = await getExistingIds();
      const onlyNewReviews = await fetchAndBuildReviewDataSet(playStoreId, code, existingIds);
      console.log(`Total new reviews for country <${code}> are ${onlyNewReviews.length}`);
      await saveNewReviews(playStoreId, code, onlyNewReviews, dryrun);
      finalReviews.push(...onlyNewReviews);
      if (onlyNewReviews.length > 0) {
        const countryReviews = buildCountryReviews(code, onlyNewReviews);
        if (countryReviews.length > 0) {
          const data = buildReviews(code, countryReviews, true);
          await postToSlack(slackAndroidUrl, data);
        }
      }
      await delay(2000);
    }

    res.header('Content-Type', 'application/json');
    res.send(JSON.stringify(finalReviews, null, 4));
  } catch (error) {
    return next(error);
  }
});

async function saveNewReviews(playStoreId, code, reviews, dryrun) {
  if (reviews.length > 0 && !dryrun) {
    const allDBResponses = reviews.map((eachRes) => {
      return {
        appId: playStoreId,
        appVersion: eachRes.version,
        countryCode: code,
        reviewId: eachRes.id,
        score: eachRes.score,
        title: eachRes.title,
        content: eachRes.text,
        url: eachRes.url
      };
    });
    await ReviewModelAndroid.insertMany(allDBResponses);
    console.log(`Successful reviews save for country <${code}> total: ${reviews.length}`);
  }
}

async function fetchAndBuildReviewDataSet(appStoreId, code, existingIds) {
  const reviewData =
    (await playStore.reviews({
      appId: appStoreId,
      throttle: 10,
      num: 50,
      country: code
    })).data || [];
  const onlyNewReviews = reviewData.filter((eachReview) => !existingIds.includes(eachReview.id));
  return onlyNewReviews;
}

async function getExistingIds() {
  const oldRatings = await ReviewModelAndroid.find({}, { reviewId: 1, _id: 0 }).sort({ createdAt: -1 }).limit(500);
  const existingIds = oldRatings.map((eachRes) => {
    return eachRes.reviewId;
  });
  return existingIds;
}

async function fetchAndBuildRatings(playStoreId, code) {
  const ratingData = await playStore.app({
    appId: playStoreId,
    throttle: 10,
    country: code
  });
  return ratingData;
}

async function saveRatingsData(playStoreId, code, ratingData, dryrun) {
  if (!dryrun) {
    const ratingModel = new RatingsModelAndroid({
      appId: ratingData.appId,
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

export default router;
