const express = require('express');
const artistRouter = require('./artists');
const seriesRouter = require('./series');
const app = require('../server');

const apiRouter = express();

apiRouter.use('/artists', artistRouter);
apiRouter.use('/series', seriesRouter);

module.exports = apiRouter;