const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { 
  getProducts,
  getProductById,
  placeOrder,
  getMyOrders,
  getOrderById
} = require("../controllers/customerController");

// Customer must be logged in
router.get("/products", getProducts);
router.get("/products/:id", getProductById);

router.post("/orders", auth, placeOrder);
router.get("/orders", auth, getMyOrders);
router.get("/orders/:id", auth, getOrderById);

module.exports = router;
