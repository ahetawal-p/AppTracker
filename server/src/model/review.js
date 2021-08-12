/* eslint-disable comma-dangle */
import mongoose from 'mongoose';

const { Schema } = mongoose;

const ReviewSchema = new Schema(
  {
    createdOn: { type: Date, required: true, default: Date.now },
    appId: { type: String, required: true, index: true },
    appVersion: { type: String },
    countryCode: { type: String, required: true, default: 'us' },
    reviewId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    score: { type: Number, required: true, default: 0 },
    title: { type: String },
    content: { type: String },
    url: { type: String, required: true }
  },
  { timestamps: { createdAt: 'systemCreatedOn', updatedAt: 'modifiedOn' } }
);
const ReviewModelIOS = mongoose.model('review_ios', ReviewSchema);
const ReviewModelAndroid = mongoose.model('review_android', ReviewSchema);

export { ReviewModelIOS, ReviewModelAndroid };
