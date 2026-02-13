require("dotenv").config();

const app = require("./app")
const connectMongo = require("./config/mongo");
const Order = require("./models/Order");
const fetchOrders = require("./services/idosell.service");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectMongo();

        await fetchOrders();
        setInterval(fetchOrders, 300000);
        app.listen(PORT, () => {
        console.log(`API works on port  ${PORT}`);
    });

    } catch (error) {
        console.error("Error starting server:", error.message)
        process.exit(1);
    }
};

startServer();