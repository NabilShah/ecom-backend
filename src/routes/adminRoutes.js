const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const {
  createProduct,
  updateProduct,
  deleteProduct
} = require("../controllers/adminController");

// Admin-only routes
router.post("/product", auth, role("admin"), createProduct);
router.put("/product/:id", auth, role("admin"), updateProduct);
router.delete("/product/:id", auth, role("admin"), deleteProduct);

module.exports = router;
