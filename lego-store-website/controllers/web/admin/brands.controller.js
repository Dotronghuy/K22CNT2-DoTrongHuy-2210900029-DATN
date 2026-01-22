const { success, error } = require('../../../helpers/response');

const Brand = require('../../../models/brand.model');
const Product = require('../../../models/product.model');

class BrandController {
    async overview(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10;

            const totalItems = await Brand.countDocuments();
            const totalPages = Math.ceil(totalItems / limit);

            let brands = await Brand.find()
                .sort({ name: 1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();

            const productBrands = await Product.distinct('brandId');

            brands = brands.map(b => ({
                ...b,
                isDelete: !productBrands.includes(b._id)
            }));

            const startIndex = (page - 1) * limit;
            const endIndex = Math.min(startIndex + brands.length, totalItems);

            res.render('admin/brands', {
                title: 'Quản lý thương hiệu',
                brands,
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
                },
            });
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi lấy danh sách thương hiệu');
        }
    }
}

module.exports = new BrandController();
