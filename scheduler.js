#!/usr/bin/env node
const got = require('got');
const moment = require('moment-timezone');

const currentDay = moment().tz('America/Los_Angeles').weekday();

(async () => {
  var myArgs = process.argv.slice(2);
  console.log('myArgs: ', myArgs);
  try {
    let response = '';
    switch (myArgs[0]) {
      case 'playstore-ratings':
        console.log('Triggering playstore ratings');
        if (currentDay == 1) {
          response = await got('https://thgotracker.herokuapp.com/playstore/ratings');
          console.log(response.body);
        } else {
          console.log('Not triggering playstore ratings as its not a Monday');
        }
        break;
      case 'playstore-reviews':
        console.log('Triggering playStore reviews');
        response = await got('https://thgotracker.herokuapp.com/playstore/reviews');
        console.log(response.body);
        break;
      case 'appstore-ratings':
        console.log('Triggering appStore ratings');
        if (currentDay == 1) {
          response = await got('https://thgotracker.herokuapp.com/appstore/ratings');
          console.log(response.body);
        } else {
          console.log('Not triggering appStore ratings as its not a Monday');
        }
        break;
      case 'appstore-reviews':
        console.log('Triggering appStore reviews');
        response = await got('https://thgotracker.herokuapp.com/appstore/reviews');
        console.log(response.body);
        break;
      case 'social':
        console.log('Triggering tweets');
        response = await got('https://thgotracker.herokuapp.com/social');
        console.log(response.body);
        break;
      default:
        console.log('Default hitting home');
        response = await got('https://thgotracker.herokuapp.com/');
        console.log(response.body);
    }
  } catch (error) {
    console.log(error);
  }
})();
