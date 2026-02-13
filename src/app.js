require("dotenv").config();
const express = require("express");
const Order = require("./models/Order")
const { Parser } = require('json2csv');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const auth = require("./middleware/auth");
const User = require("./models/User");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});
/*
app.post("/test_order", async (req, res) => {
    try {
        const order = new Order({
            orderNumber: "12395" ,
            products: [
                { productId: "A1", quantity: 2 },
                { productId: "B2", quantity: 1 },
            ],
            worth: 300,
            status: "new",
        });

        await
        order.save();

        res.json({ message: "Order saved", order });
    } catch (error) {
        res.status(500).json({ error: error.message})
    }
});
*/
app.get("/orders", auth,  async (req, res) => {
    try {
        const { minWorth, maxWorth } = req.query;
        const filter = {};

        if (minWorth) {
            filter.worth = { ...filter.worth, $gte: Number(minWorth) };
        }

        if (maxWorth) {
            filter.worth = { ...filter.worth, $lte: Number(maxWorth) };
        }

        const orders = await Order.find(filter);

        res.json(orders);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/orders/csv", auth, async (req, res) => {
    try {
        const orders = await Order.find({}).lean();

        if (!orders.length) {
            return res.status(404).json({ message: "Zero orders found" });
        }
        
        const ordersForCsv = orders.map(o => ({
        orderNumber: o.orderNumber,
        products: JSON.stringify(o.products),
        worth: o.worth,
        status: o.status,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt
        }));

        const fields = ["orderNumber", "products", "worth", "status", "createdAt", "updatedAt"];
        const opts = { fields };

        const parser = new Parser(opts);
        const csv = parser.parse(ordersForCsv);

        res.header('Content-Type', 'text/csv');
        res.attachment('orders.csv');
        res.send(csv);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
        return res.status(401).json({ message: "Invalid username" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid password" });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SEKRET, { expiresIn:"1h" });

    res.json({ token });
});

app.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        const existinUser = await User.findOne({ username });
        if (existinUser) {
            return res.status(400).json({ message: "Username already taken" });
        }
        const hashedPass = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPass });
        await newUser.save();

        res.status(201).json({ message: "User registered succesfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/orders/:id/cs", auth, async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id).lean();

        if(!order) {
            return res.status(404).json({ message: "Order not found" });
        }


        res.json(order);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/orders/:orderNumber/csv", auth, async (req, res) => {
    try {
        const { orderNumber } = req.params;

        const order = await Order.findOne({ orderNumber }).lean();

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const orderForCsv = {
            orderNumber: order.orderNumber,
            products: order.products.map(p => `${p.productId}:${p.quantity}:${p.price}`).join(" | "),
            worth: order.worth,
            status: order.status,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        };

        const fields = ["orderNumber", "products", "worth", "status", "createdAt", "updatedAt"];
        const opts = { fields };

        const { Parser } = require('json2csv');
        const parser = new Parser(opts);
        const csv = parser.parse([orderForCsv]);

        res.header('Content-Type', 'text/csv');
        res.attachment(`order_${order.orderNumber}.csv`);
        res.send(csv);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
module.exports = app;

