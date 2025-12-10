const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getProducts, getProductById, placeOrder, getMyOrders, getOrderById, cancelOrder } = require("../controllers/customerController");

router.get("/products", getProducts);
router.get("/products/:id", getProductById);

router.post("/orders", auth, placeOrder);
router.get("/orders", auth, getMyOrders);
router.get("/orders/:id", auth, getOrderById);
router.put("/orders/:id/cancel", auth, cancelOrder);

module.exports = router;