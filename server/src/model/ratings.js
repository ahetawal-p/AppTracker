/* eslint-disable comma-dangle */
import mongoose from 'mongoose';

const { Schema } = mongoose;

const RatingsSchema = new Schema(
  {
    appId: { type: String, required: true, index: true },
    appVersion: { type: String, required: true },
    appUrl: { type: String, required: true },
    countryCode: { type: String, required: true, default: 'us' },
    totalScore: { type: Number, required: true, default: 0 },
    totalReviews: { type: Number, required: true, default: 0 },
    totalRatings: { type: Number, required: true, default: 0 },
    rating1: { type: Number, required: true, default: 0 },
    rating2: { type: Number, required: true, default: 0 },
    rating3: { type: Number, required: true, default: 0 },
    rating4: { type: Number, required: true, default: 0 },
    rating5: { type: Number, required: true, default: 0 }
  },
  { timestamps: { createdAt: 'systemCreatedOn', updatedAt: 'modifiedOn' } }
);
const RatingsModelIOS = mongoose.model('ratings_ios', RatingsSchema);
const RatingsModelAndroid = mongoose.model('ratings_android', RatingsSchema);

export { RatingsModelIOS, RatingsModelAndroid };
