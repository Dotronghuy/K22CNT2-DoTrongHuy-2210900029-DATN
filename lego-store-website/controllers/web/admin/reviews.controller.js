const Review = require('../../../models/review.model');

class ReviewsController {
    async overview(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10;

            const q = req.query.q?.trim() || null;

            let matchCondition = {};

            // Build aggregation pipeline
            const pipeline = [
                { $match: matchCondition },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'productId',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
            ];

            // Add search condition if query exists
            if (q) {
                pipeline.push({
                    $match: {
                        $or: [
                            { 'product.name': { $regex: q, $options: 'i' } },
                            { 'user.fullName': { $regex: q, $options: 'i' } },
                            { 'user.email': { $regex: q, $options: 'i' } },
                            { comment: { $regex: q, $options: 'i' } }
                        ]
                    }
                });
            }

            // Get total count
            const countPipeline = [...pipeline, { $count: 'total' }];
            const countResult = await Review.aggregate(countPipeline);
            const totalItems = countResult.length > 0 ? countResult[0].total : 0;
            const totalPages = Math.ceil(totalItems / limit);

            // Get paginated results
            const reviews = await Review.aggregate([
                ...pipeline,
                { $sort: { createdAt: -1 } },
                { $skip: (page - 1) * limit },
                { $limit: limit },
                {
                    $project: {
                        _id: 1,
                        rating: 1,
                        comment: 1,
                        status: 1,
                        createdAt: 1,
                        'product.name': 1,
                        'product._id': 1,
                        'user.fullName': 1,
                        'user.email': 1
                    }
                }
            ]);

            const startIndex = (page - 1) * limit;
            const endIndex = Math.min(startIndex + reviews.length, totalItems);

            res.render('admin/reviews', {
                title: 'Quản lý đánh giá',
                reviews,
                q,
                pagination: {
                    startIndex: startIndex + (totalItems > 0 ? 1 : 0),
                    endIndex,
                    totalItems,
                    currentPage: page,
                    totalPages,
                    hasPrevPage: page > 1,
                    hasNextPage: page < totalPages,
                    prevPage: page - 1,
                    nextPage: page + 1
                }
            });

        } catch (err) {
            console.error('Reviews Error:', err);
            res.render('admin/reviews', {
                title: 'Quản lý đánh giá',
                reviews: [],
                pagination: null
            });
        }
    }
}

module.exports = new ReviewsController();
