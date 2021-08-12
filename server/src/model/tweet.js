/* eslint-disable comma-dangle */
import mongoose from 'mongoose';

const { Schema } = mongoose;

const TweetFetchSchema = new Schema(
  {
    sinceId: { type: String, default: '' },
    _id: { type: String, required: true }
  },
  { timestamps: { createdAt: 'systemCreatedOn', updatedAt: 'modifiedOn' } }
);
const TweetFetchModel = mongoose.model('tweet', TweetFetchSchema);

export default TweetFetchModel;
