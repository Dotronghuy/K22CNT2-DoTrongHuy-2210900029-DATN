const Product = require('../../../models/product.model');
const Category = require('../../../models/category.model');
const { success, error } = require('../../../helpers/response');

class HomeController {
    async overview(req, res) {
        try {
            // Reusable product aggregation stages
            const productAggregationStages = [
                {
                    $lookup: {
                        from: 'brands',
                        localField: 'brandId',
                        foreignField: '_id',
                        as: 'brand'
                    }
                },
                {
                    $addFields: {
                        brandName: {
                            $ifNull: [{ $arrayElemAt: ['$brand.name', 0] }, '']
                        }
                    }
                },
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
                            $cond: [
                                { $gt: [{ $size: '$variantCombinations' }, 0] },
                                {
                                    $gt: [
                                        {
                                            $size: {
                                                $filter: {
                                                    input: '$stockEntries',
                                                    as: 'se',
                                                    cond: {
                                                        $and: [
                                                            { $eq: ['$$se.status', 'imported'] },
                                                            { $gt: ['$$se.remainingQuantity', 0] },
                                                            { $ne: ['$$se.variantCombinationId', null] }
                                                        ]
                                                    }
                                                }
                                            }
                                        },
                                        0
                                    ]
                                },
                                {
                                    $gt: [
                                        {
                                            $size: {
                                                $filter: {
                                                    input: '$stockEntries',
                                                    as: 'se',
                                                    cond: {
                                                        $and: [
                                                            { $eq: ['$$se.status', 'imported'] },
                                                            { $gt: ['$$se.remainingQuantity', 0] },
                                                        ]
                                                    }
                                                }
                                            }
                                        },
                                        0
                                    ]
                                }
                            ]
                        }
                    }
                },
                { $match: { hasStock: true, isActive: true } },
                {
                    $addFields: {
                        images: {
                            $cond: [
                                { $eq: ['$hasVariants', true] },
                                {
                                    $reduce: {
                                        input: '$variantCombinations',
                                        initialValue: [],
                                        in: {
                                            $concatArrays: [
                                                '$$value',
                                                { $ifNull: ['$$this.images', []] }
                                            ]
                                        }
                                    }
                                },
                                '$images'
                            ]
                        }
                    }
                },
                {
                    $addFields: {
                        price: {
                            $cond: [
                                { $eq: ['$hasVariants', true] },
                                {
                                    $min: {
                                        $map: {
                                            input: '$variantCombinations',
                                            as: 'vc',
                                            in: '$$vc.price'
                                        }
                                    }
                                },
                                '$price'
                            ]
                        }
                    }
                },
                {
                    $project: {
                        brand: 0,
                        stockEntries: 0,
                        hasStock: 0,
                        variantCombinations: 0
                    }
                }
            ];

            // 1. Get New Products (Sorted by createdAt)
            const newProducts = await Product.aggregate([
                ...productAggregationStages,
                { $sort: { createdAt: -1 } },
                { $limit: 8 }
            ]);

            // 2. Get Best Selling Products (Random sample for now, or you can implement sales count logic)
            const bestSellingProducts = await Product.aggregate([
                ...productAggregationStages,
                { $sample: { size: 8 } }
            ]);

            // 3. Get Products by Category
            const categoryBlocks = await Category.aggregate([
                { $match: { isActive: true } },
                {
                    $lookup: {
                        from: 'products',
                        let: {
                            categoryId: '$_id',
                            categoryName: '$name'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$categoryId', '$$categoryId'] },
                                            { $eq: ['$isActive', true] }
                                        ]
                                    }
                                }
                            },
                            ...productAggregationStages,
                            {
                                $addFields: {
                                    categoryName: '$$categoryName'
                                }
                            },
                            { $sample: { size: 8 } }
                        ],
                        as: 'products'
                    }
                },
                {
                    $match: {
                        'products.0': { $exists: true }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        categoryName: '$name',
                        products: 1
                    }
                }
            ]);

            res.render('user/home', {
                title: 'Trang chủ',
                newProducts,
                bestSellingProducts,
                categoryBlocks
            });

        } catch (err) {
            console.error(err);
            res.status(500).render('user/home', {
                title: 'Trang chủ',
                newProducts: [],
                bestSellingProducts: [],
                categoryBlocks: [],
                errorMsg: 'Có lỗi xảy ra khi tải danh sách sản phẩm.'
            });
        }
    }
}

module.exports = new HomeController();

