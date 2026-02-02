var express = require('express');
var router = express.Router();

const { asyncHandler } = require('../../../utils/index');

const ReviewsController = require('../../../controllers/web/admin/reviews.controller');

router.get('/', asyncHandler(ReviewsController.overview));

module.exports = router;
