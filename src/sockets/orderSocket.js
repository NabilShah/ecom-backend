module.exports = (socket, io) => {

  console.log("Socket connected:", socket.id);

  // -----------------------------
  // JOIN ROOMS BASED ON ROLE
  // -----------------------------

  // CUSTOMER CLIENT
  socket.on("joinCustomer", (customerId) => {
    socket.join(`customer:${customerId}`);
    console.log(`Customer ${customerId} joined room customer:${customerId}`);
  });

  // DELIVERY PARTNER CLIENT
  socket.on("joinDelivery", (deliveryId) => {
    socket.join(`delivery:${deliveryId}`);
    socket.join("delivery-available");  // waiting for orders
    console.log(`Delivery partner ${deliveryId} joined`);
  });

  // ADMIN CLIENT
  socket.on("joinAdmin", () => {
    socket.join("admin");
    console.log(`Admin joined admin room`);
  });

  // -----------------------------
  // DELIVERY ACCEPT ORDER (via socket, optional)
  // -----------------------------
  socket.on("acceptOrderRequest", async ({ orderId, deliveryId }) => {
    // This triggers the same handling as REST API
    const Order = require("../models/Order");

    const accepted = await Order.findOneAndUpdate(
      { _id: orderId, status: "unassigned" },
      { status: "accepted", assignedTo: deliveryId },
      { new: true }
    );

    if (!accepted) {
      socket.emit("acceptFailed", { orderId });
      return;
    }

    // Notify delivery, customer & admin
    io.to(`delivery:${deliveryId}`).emit("orderAssigned", accepted);
    io.to(`customer:${accepted.customer}`).emit("orderAssigned", accepted);
    io.to("admin").emit("orderAssigned", accepted);
  });

  // -----------------------------
  // DELIVERY STATUS UPDATE
  // -----------------------------
  socket.on("updateStatus", async ({ orderId, status, deliveryId }) => {
    const Order = require("../models/Order");

    const updated = await Order.findOneAndUpdate(
      { _id: orderId, assignedTo: deliveryId },
      { status },
      { new: true }
    );

    if (!updated) {
      socket.emit("statusUpdateFailed", { orderId });
      return;
    }

    // Notify both
    io.to(`customer:${updated.customer}`).emit("orderUpdated", updated);
    io.to("admin").emit("orderUpdated", updated);
  });

  // -----------------------------
  // HANDLE DISCONNECT
  // -----------------------------
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
};
