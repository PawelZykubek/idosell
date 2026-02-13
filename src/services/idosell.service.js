require("dotenv").config();
const axios = require("axios");
const Order = require("../models/Order");
const fs = require("fs"); 


const fetchOrders = async () => {
    try {
      
        const raw = fs.readFileSync("./src/services/sample.json", "utf-8"); 
        const response = JSON.parse(raw); 

        const data = response.data;

        const orders = [];

        for (const key in data) {
            const item = data[key];
            
            if (!item || !item.product) continue;

            orders.push({
                orderNumber: key,
                products: [{
                    productId: item.product?.id,
                    name: item.product?.name,
                    quantity: item.product?.sizes[0]?.amount,
                    price: item.product?.price?.price?.net?.value
                }
            ],
            worth: item.product?.price?.unit?.net?.value,
            status: "new",
            });
        }

        for (const order of orders) {
            await Order.updateOne({ orderNumber: order.orderNumber },
                {$set: order },
                { upsert: true }
            );
        }

        console.log("Number of orders: ", orders.length);
        console.log("Orders data: ", JSON.stringify(orders, null, 2));

    } catch (error) {
        console.error("Idosell fetch error: ", error.message);
    }
};


module.exports = fetchOrders;

/*
require("dotenv").config();
const axios = require("axios");
const Order = require("../models/Order");

const fetchOrders = async () => {
    try {
        const response = await axios.get(process.env.BASE_URL, {
            headers: {
        "Accept": "application/json",
        "Authorization": `Basic ${process.env.API_KEY}`
    }
        });

        const data = response.data;

        const orders = [];

        for (const key in data) {
            const item = data[key];
            
            if (!item || !item.product) continue;

            orders.push({
                orderNumber: key,
                product: [{
                    productId: item.product?.id,
                    name: item.product?.name,
                    quantity: item.product?.sizes[0]?.amount,
                    price: item.product?.price?.price?.net?.value
                }
            ],
            worth: item.product?.price?.unit?.net?.value,
            status: "new",
            });
        }

        for (const order of orders) {
            await Order.updateOne({ orderNumber: order.orderNumber },
                {$set: order },
                { upsert: true }
            );
        }

        console.log("Orders synced: ", orders.length);
        console.log("Orders data: ", JSON.stringify(orders, null, 2));

    } catch (error) {
        console.error("Idosell fetch error: ", error.message);
    }
};


module.exports = fetchOrders;
*/