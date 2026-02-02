var express = require('express');
var router = express.Router();

const { asyncHandler } = require('../../utils/index');
const { authAdmin } = require('../../middlewares/checkAuth');

const ReviewsController = require('../../controllers/api/admin/reviews.controller');

router.use(authAdmin);

router.patch('/toggle/:id', asyncHandler(ReviewsController.toggle));

module.exports = router;
