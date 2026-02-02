const { success, error } = require('../../../helpers/response');
const Review = require('../../../models/review.model');

class ReviewsController {
    /**
     * Toggle review visibility status (show/hide)
     * @route PATCH /api/reviews/toggle/:id
     */
    async toggle(req, res) {
        try {
            const { id } = req.params;

            const review = await Review.findById(id);
            if (!review) {
                return error(res, 404, 'Đánh giá không tồn tại');
            }

            // Toggle status: 1 = visible, 0 = hidden
            review.status = review.status === 1 ? 0 : 1;
            await review.save();

            success(res, 200, `Đã ${review.status === 1 ? 'hiển thị' : 'ẩn'} đánh giá`, {
                id: review._id,
                status: review.status
            });
        } catch (err) {
            console.error('Toggle Review Error:', err);
            error(res, 500, 'Có lỗi xảy ra khi cập nhật trạng thái đánh giá');
        }
    }
}

module.exports = new ReviewsController();
