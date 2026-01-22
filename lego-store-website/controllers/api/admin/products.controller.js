const { success, error } = require('../../../helpers/response');

const Product = require('../../../models/product.model');
const StockEntry = require('../../../models/stockEntry.model');
const fs = require('fs');
const path = require('path');
class ProductController {

    async add(req, res) {
        try {
            const { name, price, categoryId, brandId, productInfo, usage, hasVariants } = req.body;

            let images = [];
            if (req.files && req.files.length > 0) {
                images = req.files.map(f => {
                    const relativePath = path.join('/uploads/products', f.filename).replace(/\\/g, '/');
                    return relativePath;
                });
            }

            const newProduct = new Product({
                name: name.trim(),
                price: price ? parseFloat(price) : 0,
                brandId,
                categoryId,
                productInfo,
                usage,
                isActive: false,
                hasVariants,
                images
            });

            await newProduct.save();

            success(res, 201, 'Thêm sản phẩm thành công', newProduct);

        } catch (err) {
            console.error(err);
            if (err.status) return error(res, err.status, err.message);
            error(res, 500, 'Có lỗi xảy ra khi thêm sản phẩm');
        }
    }

    async edit(req, res) {
        try {
            const { id } = req.params;
            const {
                name,
                price,
                categoryId,
                brandId,
                productInfo,
                usage,
                hasVariants
            } = req.body;

            const product = await Product.findById(id);
            if (!product) {
                return error(res, 404, 'Sản phẩm không tồn tại');
            }

            const prevHasVariants = product.hasVariants;
            const nextHasVariants =
                hasVariants === true || hasVariants === 'true';

            if (!name || !categoryId || !brandId) {
                return error(
                    res,
                    400,
                    'Vui lòng nhập đầy đủ tên, danh mục và thương hiệu'
                );
            }

            const hasAnyVariantCombination =
                (product.variantCombinations && product.variantCombinations.length > 0) ||
                (product.variants && product.variants.length > 0);

            if (
                hasAnyVariantCombination &&
                nextHasVariants !== prevHasVariants
            ) {
                return error(
                    res,
                    400,
                    'Không thể thay đổi trạng thái biến thể khi sản phẩm đã có tổ hợp biến thể'
                );
            }

            if (prevHasVariants === true && nextHasVariants === false) {

                if (!price || isNaN(price) || Number(price) <= 0) {
                    return error(
                        res,
                        400,
                        'Vui lòng nhập giá bán cho sản phẩm'
                    );
                }
                const hasNewImages = req.files && req.files.length > 0;
                const hasOldImages =
                    product.images && product.images.length > 0;

                if (!hasNewImages && !hasOldImages) {
                    return error(
                        res,
                        400,
                        'Vui lòng chọn ít nhất 1 hình ảnh cho sản phẩm'
                    );
                }
            }

            let images = product.images;

            if (nextHasVariants === true) {
                product.images.forEach(imgPath => {
                    try {
                        const filePath = path.join('public', imgPath);
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    } catch (err) {
                        console.warn('Không thể xoá ảnh:', imgPath);
                    }
                });
                images = [];
            } else {
                if (req.files && req.files.length > 0) {
   
                    product.images.forEach(imgPath => {
                        try {
                            const filePath = path.join('public', imgPath);
                            if (fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                            }
                        } catch { }
                    });

                    images = req.files.map(file =>
                        path
                            .join('/uploads/products', file.filename)
                            .replace(/\\/g, '/')
                    );
                }
            }

            product.name = name.trim();
            product.price = nextHasVariants ? 0 : Number(price);
            product.categoryId = categoryId;
            product.brandId = brandId;
            product.productInfo = productInfo;
            product.usage = usage;
            product.hasVariants = nextHasVariants;
            product.images = images;

            await product.save();

            success(res, 200, 'Cập nhật sản phẩm thành công', product);

        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi cập nhật sản phẩm');
        }
    }


    async delete(req, res) {
        try {
            const { id } = req.params;

            const product = await Product.findById(id);
            if (!product) {
                return error(res, 404, 'Sản phẩm không tồn tại');
            }

            if (product.images && product.images.length > 0) {
                for (const imgPath of product.images) {
                    const imagePath = path.join('public', imgPath);
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                }

            }

            await Product.findByIdAndDelete(id);

            success(res, 200, 'Xóa sản phẩm thành công');
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi xóa sản phẩm');
        }
    }

    async toggle(req, res) {
        try {
            const { id } = req.params;

            const product = await Product.findById(id);
            if (!product) {
                return error(res, 404, 'Sản phẩm không tồn tại');
            }

            const nextIsActive = !product.isActive;

            if (nextIsActive && product.hasVariants === true) {

                const hasVariants = product.variants && product.variants.length > 0;

                const hasVariantCombinations =
                    product.variantCombinations && product.variantCombinations.length > 0;

                if (!hasVariants || !hasVariantCombinations) {
                    return error(
                        res,
                        400,
                        'Sản phẩm có biến thể phải có ít nhất 1 biến thể và 1 tổ hợp biến thể trước khi bật bán'
                    );
                }
            }

            product.isActive = nextIsActive;
            await product.save();

            success(res, 200, 'Cập nhật trạng thái sản phẩm thành công', {
                id: product._id,
                isActive: product.isActive
            });
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi cập nhật trạng thái sản phẩm');
        }
    }

    async toggleVariant(req, res) {
        try {
            const { id } = req.params;
            const product = await Product.findById(id);

            if (!product) {
                return error(res, 404, 'Sản phẩm không tồn tại');
            }

            const nextState = !product.hasVariants;

            if (product.hasVariants === true && nextState === false) {
                const hasAnyVariant =
                    (product.variants?.length > 0) ||
                    (product.variantCombinations?.length > 0);

                if (hasAnyVariant) {
                    return error(
                        res,
                        400,
                        'Không thể tắt biến thể khi sản phẩm vẫn còn các biến thể hoặc tổ hợp biến thể'
                    );
                }
            }
            const hasStockEntries = await StockEntry.exists({ productId: id });
            if (hasStockEntries) {
                return error(
                    res,
                    400,
                    'Không thể thay đổi trạng thái biến thể khi sản phẩm đã có lô hàng'
                );
            }
            product.hasVariants = !product.hasVariants;
            await product.save();
            success(res, 200, 'Cập nhật trạng thái biến thể sản phẩm thành công', {
                id: product._id,
                hasVariants: product.hasVariants
            });
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi cập nhật trạng thái biến thể sản phẩm');
        }
    }


    async getById(req, res) {
        try {
            const { id } = req.params;

            const product = await Product.findById(id)
                .populate('categoryId', 'name')
                .populate('brandId', 'name')
                .lean();

            if (!product) {
                return error(res, 404, 'Sản phẩm không tồn tại');
            }
            const hasStockEntry = await StockEntry.exists({
                productId: id
            });

            product.hasStockEntry = !!hasStockEntry

            success(res, 200, 'Lấy thông tin sản phẩm thành công', product);
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi lấy sản phẩm');
        }
    }

    async getByCategory(req, res) {
        try {
            const { categoryId } = req.params;

            const matchProduct = { isActive: true };
            if (categoryId && categoryId !== 'all') {
                matchProduct.categoryId = categoryId;
            }

            const products = await Product.aggregate([
                { $match: matchProduct },
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

                {
                    $lookup: {
                        from: 'categories',
                        localField: 'categoryId',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },

                {
                    $lookup: {
                        from: 'brands',
                        localField: 'brandId',
                        foreignField: '_id',
                        as: 'brand'
                    }
                },
                { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },

                {
                    $addFields: {
                        images: {
                            $cond: [
                                { $eq: ['$hasVariants', true] },
                                {
                                    $ifNull: [
                                        { $arrayElemAt: ['$variantCombinations.images', 0] },
                                        '$images'
                                    ]
                                },
                                '$images'
                            ]
                        },
                        price: {
                            $cond: [
                                { $eq: ['$hasVariants', true] },
                                {
                                    $ifNull: [
                                        { $arrayElemAt: ['$variantCombinations.price', 0] },
                                        '$price'
                                    ]
                                },
                                '$price'
                            ]
                        }
                    }
                },

                { $sort: { createdAt: -1 } },
                { $project: { stockEntries: 0, hasStock: 0 } }
            ]);
            success(res, 200, 'Lấy danh sách sản phẩm còn hàng thành công', products);
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi lấy danh sách sản phẩm');
        }
    }

    async addVariant(req, res) {
        try {
            const { id } = req.params;
            const { name, options } = req.body;

            if (!name || !options || !Array.isArray(options) || options.length === 0) {
                return error(res, 400, 'Vui lòng nhập tên biến thể và ít nhất một tùy chọn');
            }

            const product = await Product.findById(id);
            if (!product) {
                return error(res, 404, 'Sản phẩm không tồn tại');
            }

            if (!product.hasVariants) {
                return error(res, 400, 'Sản phẩm này không bật tính năng biến thể');
            }

            if (product.variantCombinations.length > 0) {
                return error(res, 400, 'Sản phẩm đã có tổ hợp biến thể, không thể thêm biến thể mới');
            }

            const duplicate = product.variants.find(v => v.name.toLowerCase() === name.trim().toLowerCase());
            if (duplicate) {
                return error(res, 400, `Biến thể "${name}" đã tồn tại`);
            }

            const newVariant = {
                name: name.trim(),
                options: options.map(o => o.trim()).filter(o => o !== '')
            };
            product.variants.push(newVariant);
            // product.hasVariants = true;

            await product.save();

            const responseVariants = buildResponseVariants(product);

            success(res, 200, 'Thêm biến thể thành công', responseVariants);
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi thêm biến thể');
        }
    }

    async deleteVariant(req, res) {
        try {
            const { id, variantId } = req.params;

            const product = await Product.findById(id);
            if (!product) {
                return error(res, 404, 'Sản phẩm không tồn tại');
            }

            if (!product.hasVariants) {
                return error(res, 400, 'Sản phẩm này chưa bật biến thể');
            }

            if (product.variantCombinations.length > 0) {
                return error(res, 400, 'Sản phẩm đã có tổ hợp biến thể, không thể xoá biến thể');
            }

            const index = product.variants.findIndex(v => v._id === variantId);
            if (index === -1) {
                return error(res, 404, 'Không tìm thấy biến thể cần xoá');
            }

            product.variants.splice(index, 1);
            await product.save();

            const responseVariants = buildResponseVariants(product);

            success(res, 200, 'Đã xoá biến thể thành công', responseVariants);
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi xoá biến thể');
        }
    }

    async updateVariant(req, res) {
        try {
            const { id, variantId } = req.params;
            const { name } = req.body;

            if (!name || typeof name !== "string") {
                return error(res, 400, "Vui lòng nhập tên biến thể hợp lệ");
            }

            const product = await Product.findById(id);
            if (!product) return error(res, 404, "Sản phẩm không tồn tại");

            if (!product.hasVariants)
                return error(res, 400, "Sản phẩm này chưa bật biến thể");

            if (product.variantCombinations.length > 0) {
                return error(
                    res,
                    400,
                    "Sản phẩm đã có tổ hợp biến thể, không thể cập nhật tên biến thể"
                );
            }
            const variant = product.variants.find(v => v._id.toString() === variantId);
            if (!variant) return error(res, 404, "Không tìm thấy biến thể");

            const duplicateName = product.variants.some(
                v => v._id.toString() !== variantId &&
                    v.name.trim().toLowerCase() === name.trim().toLowerCase()
            );

            if (duplicateName) {
                return error(res, 400, `Tên biến thể "${name}" đã tồn tại`);
            }

            variant.name = name.trim();

            await product.save();

            const responseVariants = buildResponseVariants(product);

            success(res, 200, "Cập nhật tên biến thể thành công", responseVariants);

        } catch (err) {
            console.error(err);
            error(res, 500, "Có lỗi xảy ra khi cập nhật tên biến thể");
        }

    }

    async deleteVariantOption(req, res) {
        try {
            const { id, variantId } = req.params;
            const optionValue = decodeURIComponent(req.params.optionValue);

            const product = await Product.findById(id);
            if (!product) {
                return error(res, 404, 'Sản phẩm không tồn tại');
            }

            const variant = product.variants.find(v => v._id === variantId);
            if (!variant) {
                return error(res, 404, 'Không tìm thấy biến thể');
            }

            const usedInCombinations = product.variantCombinations.some(combo =>
                combo.variants.some(v =>
                    v.variantId === variantId && v.value.toLowerCase() === optionValue.trim().toLowerCase()
                )
            );

            if (usedInCombinations) {
                return error(res, 400, `Không thể xoá "${optionValue}" vì đang được sử dụng trong tổ hợp biến thể`);
            }

            const optionIndex = variant.options.findIndex(
                o => o.toLowerCase() === optionValue.trim().toLowerCase()
            );

            if (optionIndex === -1) {
                return error(res, 404, `Không tìm thấy tùy chọn "${optionValue}" trong biến thể`);
            }

            variant.options.splice(optionIndex, 1);

            if (variant.options.length === 0) {
                product.variants = product.variants.filter(v => v._id !== variantId);
            }

            await product.save();

            const responseVariants = buildResponseVariants(product);

            success(res, 200, `Đã xoá tùy chọn "${optionValue}" thành công`, responseVariants);
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi xoá tùy chọn trong biến thể');
        }
    }

    async addVariantOption(req, res) {
        try {
            const { id, variantId } = req.params;
            const { value } = req.body;

            if (!value || value.trim() === "") {
                return error(res, 400, "Vui lòng nhập giá trị tùy chọn");
            }

            const product = await Product.findById(id);
            if (!product) {
                return error(res, 404, "Sản phẩm không tồn tại");
            }

            if (!product.hasVariants) {
                return error(res, 400, "Sản phẩm này chưa bật biến thể");
            }

            const variant = product.variants.find(v => v._id === variantId);
            if (!variant) {
                return error(res, 404, "Không tìm thấy biến thể");
            }

            const newValue = value.trim();

            const isDuplicate = variant.options.some(
                o => o.trim().toLowerCase() === newValue.toLowerCase()
            );

            if (isDuplicate) {
                return error(res, 400, `Tùy chọn "${value}" đã tồn tại trong biến thể này`);
            }

            variant.options.push(newValue);

            await product.save();

            const responseVariants = buildResponseVariants(product);

            success(res, 200, `Đã thêm tùy chọn "${newValue}"`, responseVariants);
        } catch (err) {
            console.error(err);
            error(res, 500, "Có lỗi xảy ra khi thêm tùy chọn vào biến thể");
        }
    }


    async updateVariantOption(req, res) {
        try {
            const { id, variantId } = req.params;
            const { oldValue, newValue } = req.body;

            if (!oldValue || !newValue) {
                return error(res, 400, "Vui lòng nhập đầy đủ giá trị cũ và mới");
            }

            const cleanedOld = oldValue.trim();
            const cleanedNew = newValue.trim();

            if (cleanedNew === "") {
                return error(res, 400, "Giá trị mới không hợp lệ");
            }

            const product = await Product.findById(id);
            if (!product) {
                return error(res, 404, "Sản phẩm không tồn tại");
            }

            const variant = product.variants.find(v => v._id === variantId);
            if (!variant) {
                return error(res, 404, "Không tìm thấy biến thể");
            }

            const optionIndex = variant.options.findIndex(
                o => o.trim().toLowerCase() === cleanedOld.toLowerCase()
            );

            if (optionIndex === -1) {
                return error(res, 404, `Không tìm thấy tùy chọn "${oldValue}"`);
            }

            const isUsed = product.variantCombinations.some(combo =>
                combo.variants.some(v =>
                    v.variantId === variantId &&
                    v.value.trim().toLowerCase() === cleanedOld.toLowerCase()
                )
            );

            if (isUsed) {
                return error(res, 400, `Không thể cập nhật "${oldValue}" vì đang được sử dụng trong tổ hợp biến thể`);
            }

            const duplicate = variant.options.some(
                o => o.trim().toLowerCase() === cleanedNew.toLowerCase()
            );

            if (duplicate) {
                return error(res, 400, `Tùy chọn "${cleanedNew}" đã tồn tại trong biến thể`);
            }

            variant.options[optionIndex] = cleanedNew;

            await product.save();


            const responseVariants = buildResponseVariants(product);

            success(res, 200, `Đã cập nhật tùy chọn từ "${cleanedOld}" → "${cleanedNew}"`, responseVariants);

        } catch (err) {
            console.error(err);
            error(res, 500, "Có lỗi xảy ra khi cập nhật tùy chọn");
        }
    }

    async getVariants(req, res) {
        try {
            const { id } = req.params;

            const product = await Product.findById(id).select('variants variantCombinations hasVariants').lean();

            if (!product) {
                return error(res, 404, 'Sản phẩm không tồn tại');
            }

            if (!product.hasVariants) {
                return success(res, 200, 'Sản phẩm chưa bật biến thể', []);
            }

            if (product.variants) {
                const hasCombinations = product.variantCombinations?.length > 0;
       
                product.variants = product.variants.map(variant => {
                    const updatedOptions = variant.options.map(optionValue => {
                        const isLocked = product.variantCombinations?.some(combo =>
                            combo.variants.some(v =>
                                v.variantId.toString() === variant._id.toString() &&
                                v.value.trim().toLowerCase() === optionValue.trim().toLowerCase()
                            )
                        ) || false;

                        return {
                            value: optionValue,
                            isLocked
                        };
                    });

                    return {
                        ...variant,
                        isLocked: hasCombinations,
                        options: updatedOptions
                    };
                });
            }

            const stockCombinationIds = await StockEntry.distinct(
                'variantCombinationId',
                { productId: id }
            );

            if (product.variantCombinations?.length) {
                product.variantCombinations = product.variantCombinations.map(combo => ({
                    ...combo,
                    isLocked: stockCombinationIds.some(
                        cid => cid.toString() === combo._id.toString()
                    )
                }));
            }


            success(res, 200, 'Lấy danh sách biến thể thành công', {
                variants: product.variants || [],
                variantCombinations: product.variantCombinations || [],
            });
        } catch (err) {
            console.error(err);
            error(res, 500, 'Có lỗi xảy ra khi lấy biến thể sản phẩm');
        }
    }

    async addVariantCombination(req, res) {
        try {
            const { id } = req.params;
            let { variantKey, variants } = req.body;

            if (typeof variants === "string") {
                try {
                    variants = JSON.parse(variants);
                } catch (err) {
                    return error(res, 400, "Dữ liệu tổ hợp không hợp lệ (variants parse error)");
                }
            }
            if (!variantKey || !variants || !Array.isArray(variants) || variants.length === 0) {
                return error(res, 400, "Dữ liệu tổ hợp không hợp lệ");
            }

            const product = await Product.findById(id);
            if (!product) {
                return error(res, 404, "Sản phẩm không tồn tại");
            }

            if (!product.hasVariants) {
                return error(res, 400, "Sản phẩm chưa bật biến thể");
            }

            // if (variants.length !== product.variants.length) {
            //     return error(res, 400, `Phải cung cấp đủ ${product.variants.length} biến thể`);
            // }

            const existed = product.variantCombinations.some(
                c => c.variantKey.toLowerCase() === variantKey.toLowerCase()
            );
            if (existed) {
                return error(res, 400, `Tổ hợp "${variantKey}" đã tồn tại`);
            }

            for (const v of variants) {
                if (!v.variantId || !v.value) {
                    return error(res, 400, "Sai định dạng biến thể trong tổ hợp");
                }

                const found = product.variants.find(va => va._id === v.variantId);
                if (!found) {
                    return error(res, 400, `Biến thể ID ${v.variantId} không tồn tại`);
                }

                const validOption = found.options.includes(v.value);
                if (!validOption) {
                    return error(res, 400, `Giá trị "${v.value}" không tồn tại trong biến thể "${found.name}"`);
                }
            }

            const isDuplicate = product.variantCombinations.some(combo => {
                if (combo.variants.length !== variants.length) {
                    return false;
                }

                return variants.every(v => {
                    const matchingVariant = combo.variants.find(
                        cv => cv.variantId.toString() === v.variantId.toString()
                    );
                    return matchingVariant && matchingVariant.value === v.value;
                });
            });

            if (isDuplicate) {
                const comboDescription = variants.map(v => {
                    const variantInfo = product.variants.find(pv => pv._id.toString() === v.variantId.toString());
                    return `${variantInfo?.name}: ${v.value}`;
                }).join(", ");
                return error(res, 400, `Tổ hợp biến thể (${comboDescription}) đã tồn tại`);
            }

            let images = [];
            if (req.files && req.files.length > 0) {
                images = req.files.map(f => {
                    const relativePath = path.join('/uploads/products', f.filename).replace(/\\/g, '/');
                    return relativePath;
                });
            }

            const newCombo = {
                variantKey,
                variants,
                stock: 0,
                images
            };

            product.variantCombinations.push(newCombo);

            await product.save();

            const responseVariants = buildResponseVariants(product);
            const responseVariantCombinations =
                await buildResponseVariantCombinations(product, id);


            return success(res, 200, "Thêm tổ hợp biến thể thành công", {
                variantCombinations: responseVariantCombinations,
                variants: responseVariants
            });
        } catch (err) {
            console.error(err);
            return error(res, 500, "Lỗi khi thêm tổ hợp biến thể");
        }
    }

    async updateVariantCombination(req, res) {
        try {
            const { id, comboId } = req.params;
            let { variantKey, variants, deletedImages } = req.body;

            if (typeof variants === 'string') {
                try {
                    variants = JSON.parse(variants);
                } catch (err) {
                    return error(res, 400, "Dữ liệu variants không hợp lệ");
                }
            }
            if (!variantKey || !variants || !Array.isArray(variants) || variants.length === 0) {
                return error(res, 400, "Dữ liệu tổ hợp không hợp lệ");
            }

            const product = await Product.findById(id);
            if (!product) return error(res, 404, "Sản phẩm không tồn tại");

            const combo = product.variantCombinations.id(comboId);
            if (!combo) return error(res, 404, "Tổ hợp biến thể không tồn tại");

            const existed = product.variantCombinations.some(
                c => c._id !== comboId && c.variantKey.toLowerCase() === variantKey.toLowerCase()
            );
            if (existed) return error(res, 400, `Tổ hợp "${variantKey}" đã tồn tại`);

            for (const v of variants) {
                if (!v.variantId || !v.value) return error(res, 400, "Sai định dạng biến thể trong tổ hợp");

                const found = product.variants.find(va => va._id === v.variantId);
                if (!found) return error(res, 400, `Biến thể ID ${v.variantId} không tồn tại`);

                if (!found.options.includes(v.value)) {
                    return error(res, 400, `Giá trị "${v.value}" không tồn tại trong biến thể "${found.name}"`);
                }
            }


            let finalImages = [...combo.images];

            if (deletedImages) {
                let deletedImagesList = [];

                if (typeof deletedImages === 'string') {
                    try {
                        deletedImagesList = JSON.parse(deletedImages);
                    } catch (err) {
                        console.warn("Không thể parse deletedImages:", err);
                        deletedImagesList = [];
                    }
                } else if (Array.isArray(deletedImages)) {
                    deletedImagesList = deletedImages;
                }

                if (deletedImagesList.length > 0) {
                    deletedImagesList.forEach(imgPath => {
                        if (!combo.images.includes(imgPath)) {
                            console.warn(`Ảnh ${imgPath} không thuộc tổ hợp này, bỏ qua xóa`);
                            return;
                        }

                        try {
                            const filePath = path.join('public', imgPath);
                            if (fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                                console.log(`Đã xóa ảnh: ${imgPath}`);
                            }
                        } catch (err) {
                            console.warn(`Không thể xóa ảnh: ${imgPath}`, err.message);
                        }

                        finalImages = finalImages.filter(img => img !== imgPath);
                    });
                }
            }

            if (req.files && req.files.length > 0) {
                const newImages = req.files.map(f => {
                    const relativePath = path.join('/uploads/products', f.filename).replace(/\\/g, '/');
                    return relativePath;
                });

                finalImages = [...finalImages, ...newImages];
            }

            combo.variantKey = variantKey;
            combo.variants = variants;
            combo.images = finalImages;

            await product.save();

            const responseVariants = buildResponseVariants(product);
            const responseVariantCombinations =
                await buildResponseVariantCombinations(product, id);

            return success(res, 200, "Cập nhật tổ hợp thành công", {
                variantCombinations: responseVariantCombinations,
                variants: responseVariants
            });

        } catch (err) {
            console.error(err);
            return error(res, 500, "Lỗi khi cập nhật tổ hợp biến thể");
        }
    }

    async updateVariantCombinationPrice(req, res) {
        try {
            const { id, comboId } = req.params;
            let { newValue: price } = req.body;

            price = Number(price);
            if (isNaN(price) || price < 0) {
                return error(res, 400, "Giá bán không hợp lệ");
            }

            const product = await Product.findById(id);
            if (!product) return error(res, 404, "Sản phẩm không tồn tại");

            const combo = product.variantCombinations.id(comboId);
            if (!combo) return error(res, 404, "Tổ hợp biến thể không tồn tại");

            combo.price = price;

            await product.save();

            const responseVariants = buildResponseVariants(product);
            const responseVariantCombinations =
                await buildResponseVariantCombinations(product, id);


            return success(res, 200, "Cập nhật giá tổ hợp thành công", {
                variantCombinations: responseVariantCombinations,
                variants: responseVariants
            });

        } catch (err) {
            console.error(err);
            return error(res, 500, "Lỗi khi cập nhật giá tổ hợp biến thể");
        }
    }

    async deleteVariantCombination(req, res) {
        try {
            const { id, comboId } = req.params;

            const product = await Product.findById(id);
            if (!product) return error(res, 404, "Sản phẩm không tồn tại");

            const index = product.variantCombinations.findIndex(c => c._id === comboId);
            if (index === -1) return error(res, 404, "Tổ hợp biến thể không tồn tại");


            const combo = product.variantCombinations.id(comboId);
            if (!combo) return error(res, 404, "Tổ hợp biến thể không tồn tại");

            if (combo.images && combo.images.length > 0) {
                console.log(`Đang xóa ${combo.images.length} ảnh của combination ${comboId}...`);

                for (const imgPath of combo.images) {
                    try {
                        const filePath = path.join('public', imgPath);

                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            console.log(`Đã xóa ảnh: ${imgPath}`);
                        } else {
                            console.warn(`File không tồn tại: ${filePath}`);
                        }
                    } catch (err) {
                        console.error(`Lỗi khi xóa ảnh ${imgPath}:`, err.message);

                    }
                }
            }
            
            product.variantCombinations.splice(index, 1);

            await product.save();

            const responseVariants = buildResponseVariants(product);
            const responseVariantCombinations =
                await buildResponseVariantCombinations(product, id);


            return success(res, 200, "Xoá tổ hợp biến thể thành công", {
                variantCombinations: responseVariantCombinations,
                variants: responseVariants
            });
        } catch (err) {
            console.error(err);
            return error(res, 500, "Lỗi khi xóa tổ hợp biến thể");
        }
    }

}

function buildResponseVariants(product) {
    if (!product?.variants?.length) return [];

    const hasCombinations = product.variantCombinations?.length > 0;

    return product.variants.map(variant => {
        const variantObj = variant.toObject ? variant.toObject() : variant;

        const options = variantObj.options.map(optionValue => {
            const isLocked = product.variantCombinations?.some(combo =>
                combo.variants.some(v =>
                    v.variantId.toString() === variantObj._id.toString() &&
                    v.value.trim().toLowerCase() === optionValue.trim().toLowerCase()
                )
            ) || false;

            return {
                value: optionValue,
                isLocked
            };
        });

        return {
            ...variantObj,
            isLocked: hasCombinations,
            options
        };
    });
}

async function buildResponseVariantCombinations(product, productId) {
    if (!product?.variantCombinations?.length) return [];

    const stockCombinationIds = await StockEntry.distinct(
        'variantCombinationId',
        { productId }
    );

    const lockedSet = new Set(stockCombinationIds.map(String));

    return product.variantCombinations.map(combo => {
        const comboObj = combo.toObject();

        return {
            ...comboObj,
            isLocked: lockedSet.has(String(comboObj._id))
        };
    });
}


module.exports = new ProductController();
