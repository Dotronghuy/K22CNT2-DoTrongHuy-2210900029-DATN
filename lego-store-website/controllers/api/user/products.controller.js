const Product = require('../../../models/product.model');
const Category = require('../../../models/category.model');
const Review = require('../../../models/review.model');

const fs = require('fs');
const path = require('path');
const { success, error } = require('../../../helpers/response');


class ProductsController {
    async overview(req, res) {
        try {
            const q = req.query.q?.trim() || null;

            const newProducts = await Product.aggregate([
      
                { $match: { isActive: true } },

          
                {
                    $lookup: {
                        from: 'stockEntries',
                        localField: '_id',
                        foreignField: 'productId',
                        as: 'stockEntries'
                    }
                },

                {
                    $addFields: {
                        hasStock: {
                            $gt: [
                                {
                                    $size: {
                                        $filter: {
                                            input: '$stockEntries',
                                            as: 'se',
                                            cond: {
                                                $and: [
                                                    { $eq: ['$$se.status', 'imported'] },
                                                    { $gt: ['$$se.remainingQuantity', 0] }
                                                ]
                                            }
                                        }
                                    }
                                },
                                0
                            ]
                        }
                    }
                },

                { $match: { hasStock: true } },

                { $sort: { createdAt: -1 } },

                { $limit: 20 },
                { $sample: { size: 8 } },

                { $project: { stockEntries: 0, hasStock: 0 } }
            ]);

            const allCategories = await Category.find({ isActive: true }, { name: 1 })
                .sort({ name: 1 })
                .lean();


            let searchResults = [];

            if (q) {
                searchResults = await Product.aggregate([
                    { $match: { isActive: true, name: { $regex: q, $options: 'i' } } },

                    {
                        $lookup: {
                            from: 'stockEntries',
                            localField: '_id',
                            foreignField: 'productId',
                            as: 'stockEntries'
                        }
                    },

                    {
                        $addFields: {
                            hasStock: {
                                $gt: [
                                    {
                                        $size: {
                                            $filter: {
                                                input: '$stockEntries',
                                                as: 'se',
                                                cond: {
                                                    $and: [
                                                        { $eq: ['$$se.status', 'imported'] },
                                                        { $gt: ['$$se.remainingQuantity', 0] }
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    0
                                ]
                            }
                        }
                    },

                    { $match: { hasStock: true } },

                    { $sort: { createdAt: -1 } },

                    { $project: { stockEntries: 0, hasStock: 0 } }
                ]);
            }


            res.render('user/products', {
                title: 'Sản phẩm',
                newProducts,
                searchResults,
                q,
                allCategories
            });
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi lấy danh sách sản phẩm');
        }
    }

    async productDetail(req, res) {
        try {
            const { id } = req.params;

            const product = await Product.findById(id)
                .populate('categoryId', 'name')
                .lean();

            if (!product) {
                return res.status(404).render('user/404', { message: 'Sản phẩm không tồn tại' });
            }

            const reviews = await Review.find({ productId: id, status: 1 })
                .populate('userId', 'fullName avatarUrl')
                .sort({ createdAt: -1 })
                .lean();

            let totalReviews = reviews.length;
            let averageRating = 0;

            if (totalReviews > 0) {
                const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
                averageRating = Math.round((sum / totalReviews) * 10) / 10;
            }

            res.render('user/productDetail', {
                title: product.name,
                product,
                reviews,
                averageRating,
                totalReviews
            });
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi lấy chi tiết sản phẩm');
        }
    }
}

module.exports = new ProductsController();
