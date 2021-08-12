import moment from 'moment-timezone';
import { APP_STORE_ID, PLAY_STORE_ID } from '../setup';

export const APPSTORE_URL = `https://apps.apple.com/{countryCode}/app/trailhead-go/id${APP_STORE_ID}`;
export const PLAYSTORE_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}&gl={countryCode}`;

export function buildAsOfTimeSection() {
  var formattedDate = moment().tz('America/Los_Angeles').format('ddd MMM Do, YYYY, hh:mm A');
  return `_As of: ${formattedDate}_`;
}

export function addDivider() {
  return {
    type: 'divider'
  };
}
