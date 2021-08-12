/* eslint-disable function-paren-newline */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable no-console */
/* eslint-disable comma-dangle */
import createError from 'http-errors';
import express from 'express';
import logger from 'morgan';
import path from 'path';
import mongoose from 'mongoose';
import defaultRouter from './routes/index';
import appStoreRouter from './routes/appstore';
import playStoreRouter from './routes/playstore';
import socialRouter from './routes/social';
import {
  PORT,
  DATABASE,
  APP_COUNTRY_CODES,
  APP_STORE_ID,
  PLAY_COUNTRY_CODES,
  PLAY_STORE_ID,
  SLACK_IOS_URL,
  SLACK_ANDROID_URL
} from './setup';

mongoose.Promise = global.Promise;

export default class App {
  constructor(config) {
    this.port = PORT;
    this.db = DATABASE;
    this.appCountryCodes = APP_COUNTRY_CODES;
    this.playCountryCodes = PLAY_COUNTRY_CODES;
    this.appStoreId = APP_STORE_ID;
    this.playStoreId = PLAY_STORE_ID;
    this.slackiOSUrl = SLACK_IOS_URL;
    this.slackAndroidUrl = SLACK_ANDROID_URL;
    this.express = express();
    this.initialize();
  }

  initialize() {
    mongoose.connect(this.db, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    });
    mongoose.connection.on('error', (error) => console.log(error));
    // mongoose.set('debug', true);

    this.configureMiddleware();
    this.configureRoutes();
  }

  start() {
    this.express.listen(this.port, () => console.log(`Listening to port ${this.port}`));
  }

  configureMiddleware() {
    const expressApp = this.express;
    expressApp.use(logger('dev'));
    expressApp.use(express.json());
    expressApp.use(express.urlencoded({ extended: false }));
    expressApp.set('port', this.port);
    expressApp.set('appCountryCodes', this.appCountryCodes);
    expressApp.set('playCountryCodes', this.playCountryCodes);
    expressApp.set('appStoreId', this.appStoreId);
    expressApp.set('playStoreId', this.playStoreId);
    expressApp.set('slackiOSUrl', this.slackiOSUrl);
    expressApp.set('slackAndroidUrl', this.slackAndroidUrl);
  }

  configureRoutes() {
    const expressApp = this.express;
    expressApp.use('/', defaultRouter);
    expressApp.use('/appstore', appStoreRouter);
    expressApp.use('/playstore', playStoreRouter);
    expressApp.use('/social', socialRouter);

    // catch 404 and forward to error handler
    expressApp.use((req, res, next) => {
      console.error(req.originalUrl);
      next(createError(404));
    });

    // error handler
    // eslint-disable-next-line no-unused-vars
    expressApp.use((err, req, res, next) => {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};
      console.error(err.stack);
      // render the error page
      res.status(err.status || 500).send({ error: { message: err.message, code: 500 } });
    });
  }
}
