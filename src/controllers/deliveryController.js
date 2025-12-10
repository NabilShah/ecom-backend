const Order = require("../models/Order");

exports.getUnassignedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: "unassigned" }).sort({ createdAt: -1 }).populate("customer", "name email");

    res.json(orders);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.acceptOrder = async (req, res) => {
  try {
    const deliveryId = req.user.id;
    const { orderId } = req.params;

    const acceptedOrder = await Order.findOneAndUpdate( { _id: orderId, status: "unassigned" }, { $set: { status: "accepted", assignedTo: deliveryId, updatedAt: new Date() }}, { new: true } );

    if (!acceptedOrder) {
      return res.status(409).json({
        message: "Order already taken by another partner"
      });
    }

    const populated = await Order.findById(acceptedOrder._id).populate("customer", "name email phone").populate("assignedTo", "name email phone");

    const io = req.app.get("io");
    io.to(`customer:${acceptedOrder.customer}`).emit("orderAssigned", populated);
    io.to(`delivery:${acceptedOrder.assignedTo}`).emit("orderAssigned", populated);
    io.to("admin").emit("orderAssigned", populated);

    return res.json({
      message: "Order accepted successfully",
      order: populated
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const deliveryId = req.user.id;
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ["picked_up", "on_the_way", "delivered"];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const updated = await Order.findOneAndUpdate( { _id: orderId, assignedTo: deliveryId }, { status, updatedAt: new Date() }, { new: true } );

    if (!updated)
      return res.status(404).json({ message: "Order not found or not assigned to you" });

    const populated = await Order.findById(updated._id).populate("customer", "name email phone").populate("assignedTo", "name email phone");

    const io = req.app.get("io");
    io.to(`customer:${updated.customer}`).emit("orderUpdated", populated);
    io.to("admin").emit("orderUpdated", populated);

    return res.json({
      message: "Order status updated",
      order: populated
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyAssignedOrders = async (req, res) => {
  try {
    const deliveryId = req.user.id;

    const orders = await Order.find({ assignedTo: deliveryId }).sort({ createdAt: -1 }).populate("customer", "name phone email").populate("assignedTo", "name phone email");

    res.json(orders);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};