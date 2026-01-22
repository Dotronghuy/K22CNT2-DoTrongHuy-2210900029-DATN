const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ReviewSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4,
        required: true
    },

    userId: {
        type: String,
        required: true,
        ref: 'User'
    },

    productId: {
        type: String,
        required: true,
        ref: 'Product'
    },

    orderItemId: {
        type: String,
        required: true,
        ref: 'OrderItem'
    },
    variantCombinationId: { type: String, default: null },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },

    comment: {
        type: String,
        trim: true,
        maxlength: 1000
    },

    images: {
        type: [String],
        default: []
    },

    status: {
        type: Number,
        enum: [0, 1],
        default: 1
    }
}, {
    versionKey: false,
    timestamps: true
});

module.exports = mongoose.model('Review', ReviewSchema, 'reviews');
