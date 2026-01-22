const Order = require('../../../models/order.model');
const OrderItem = require('../../../models/orderItem.model');
const Review = require('../../../models/review.model');
const { success, error } = require('../../../helpers/response');
const fs = require('fs');
const path = require('path');
class OrdersController {
    async cancelOrderByUser(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user._id;

            const order = await Order.findById(id);
            if (!order) return error(res, 404, 'Đơn hàng không tồn tại');

            if (order.userId.toString() !== userId.toString()) {
                return error(res, 403, 'Bạn không có quyền huỷ đơn hàng này');
            }

            if (order.status !== 'pending') {
                return error(res, 400, 'Chỉ có thể huỷ đơn hàng khi đang chờ xác nhận');
            }

            order.status = 'cancelled';
            await order.save();

            success(res, 200, 'Huỷ đơn hàng thành công', {
                orderId: order._id,
                orderCode: order.orderCode,
                status: order.status
            });

        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi huỷ đơn hàng');
        }
    }
    async reviewProduct(req, res) {
        try {
            const { orderId, itemId } = req.params;
            const userId = req.user._id;

            const orderItem = await OrderItem.findById(itemId);
            if (!orderItem) return error(res, 404, 'Không tìm thấy sản phẩm trong đơn hàng');

            if (orderItem.orderId.toString() !== orderId.toString()) {
                return error(res, 403, 'Bạn không có quyền đánh giá sản phẩm này');
            }

            if (orderItem.reviewed) {
                return error(res, 400, 'Sản phẩm đã được đánh giá');
            }

            const { rating, comment, variantCombinationId } = req.body;

            if (!rating || rating < 1 || rating > 5) {
                return error(res, 400, 'Điểm đánh giá không hợp lệ');
            }

            if (
                variantCombinationId &&
                orderItem.variantCombinationId &&
                variantCombinationId !== orderItem.variantCombinationId
            ) {
                return error(res, 400, 'Biến thể sản phẩm không khớp');
            }

            let images = [];
            if (req.files && req.files.length > 0) {
                images = req.files.map(f => {
                    const relativePath = path.join('/uploads/reviews', f.filename).replace(/\\/g, '/');
                    return relativePath;
                });
            }

            const review = new Review({
                userId,
                orderItemId: orderItem._id,
                productId: orderItem.productId,
                variantCombinationId: orderItem.variantCombinationId || null,
                rating,
                comment,
                images
            });
            await review.save();

            orderItem.reviewed = true;
            await orderItem.save();

            success(res, 201, 'Đánh giá sản phẩm thành công', { reviewId: review._id });

        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi đánh giá sản phẩm');
        }
    }
}

module.exports = new OrdersController();
