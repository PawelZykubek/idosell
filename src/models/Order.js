const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        products: [
            {
                productId: Number,
                name: String,
                quantity: Number,
                price: Number
            },
        ],

        worth: Number,

        status: String
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Order", orderSchema);