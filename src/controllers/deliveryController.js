const Order = require("../models/Order");


// -------------------------------------------------------------
// GET ALL UNASSIGNED ORDERS
// -------------------------------------------------------------
exports.getUnassignedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: "unassigned" })
      .sort({ createdAt: -1 })
      .populate("customer", "name phone");

    res.json(orders);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// -------------------------------------------------------------
// ACCEPT ORDER (ATOMIC LOCK)
// -------------------------------------------------------------
exports.acceptOrder = async (req, res) => {
  try {
    const deliveryId = req.user.id;
    const { orderId } = req.params;

    // atomic lock → ensures only one partner can accept
    const acceptedOrder = await Order.findOneAndUpdate(
      { _id: orderId, status: "unassigned" },
      {
        $set: {
          status: "accepted",
          assignedTo: deliveryId,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!acceptedOrder) {
      return res.status(409).json({
        message: "Order already taken by another partner"
      });
    }

    // Emit event to:
    // - Customer
    // - Admin
    const io = req.app.get("io");
    io.to(`customer:${acceptedOrder.customer}`).emit("orderAssigned", acceptedOrder);
    io.to("admin").emit("orderAssigned", acceptedOrder);

    return res.json({
      message: "Order accepted successfully",
      order: acceptedOrder
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// -------------------------------------------------------------
// UPDATE ORDER STATUS (PICKED_UP / ON_THE_WAY / DELIVERED)
// -------------------------------------------------------------
exports.updateOrderStatus = async (req, res) => {
  try {
    const deliveryId = req.user.id;
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ["picked_up", "on_the_way", "delivered"];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const updated = await Order.findOneAndUpdate(
      { _id: orderId, assignedTo: deliveryId },
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Order not found or not assigned to you" });

    // Notify customer + admin
    const io = req.app.get("io");
    io.to(`customer:${updated.customer}`).emit("orderUpdated", updated);
    io.to("admin").emit("orderUpdated", updated);

    return res.json({
      message: "Order status updated",
      order: updated
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// -------------------------------------------------------------
// GET MY ASSIGNED ORDERS
// -------------------------------------------------------------
exports.getMyAssignedOrders = async (req, res) => {
  try {
    const deliveryId = req.user.id;

    const orders = await Order.find({ assignedTo: deliveryId })
      .sort({ createdAt: -1 })
      .populate("customer", "name phone");

    res.json(orders);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
