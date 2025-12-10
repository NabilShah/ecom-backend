const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadProductImage");

const { createProduct, updateProduct, deleteProduct, getDeliveryPartners, getAllOrders } = require("../controllers/adminController");

router.post("/createProduct", auth, role("admin"), createProduct);
router.put("/updateProduct/:id", auth, role("admin"), updateProduct);
router.delete("/deleteProduct/:id", auth, role("admin"), deleteProduct);
router.post("/upload-product-image", auth, role("admin"),
  upload.single("image"),
  (req, res) => {
    const filePath = `uploads/product_images/${req.file.filename}`;
    res.json({ url: filePath });
  }
);
router.get("/orders", auth, role("admin"), getAllOrders);
router.get("/delivery-partners", auth, role("admin"), getDeliveryPartners);

module.exports = router;