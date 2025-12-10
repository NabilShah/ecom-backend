const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const { getUnassignedOrders, acceptOrder, updateOrderStatus, getMyAssignedOrders } = require("../controllers/deliveryController");

router.get("/unassigned", auth, role("delivery"), getUnassignedOrders);

router.post("/accept/:orderId", auth, role("delivery"), acceptOrder);

router.patch("/status/:orderId", auth, role("delivery"), updateOrderStatus);

router.get("/my-orders", auth, role("delivery"), getMyAssignedOrders);

module.exports = router;