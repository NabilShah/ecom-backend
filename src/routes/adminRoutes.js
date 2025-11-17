const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const {
  createProduct,
  updateProduct,
  deleteProduct
} = require("../controllers/adminController");

// Admin-only routes
router.post("/createProduct", auth, role("admin"), createProduct);
router.put("/updateProduct/:id", auth, role("admin"), updateProduct);
router.delete("/deleteProduct/:id", auth, role("admin"), deleteProduct);

module.exports = router;
