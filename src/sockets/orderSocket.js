module.exports = (socket, io) => {

  console.log("Socket connected:", socket.id);

  socket.on("joinCustomer", (customerId) => {
    socket.join(`customer:${customerId}`);
    console.log(`Customer ${customerId} joined room customer:${customerId}`);
  });

  socket.on("joinDelivery", (deliveryId) => {
    socket.join(`delivery:${deliveryId}`);
    socket.join("delivery-available");
    console.log(`Delivery partner ${deliveryId} joined`);
  });

  socket.on("joinAdmin", () => {
    socket.join("admin");
    console.log(`Admin joined admin room`);
  });

  socket.on("acceptOrderRequest", async ({ orderId, deliveryId }) => {
    const Order = require("../models/Order");

    const accepted = await Order.findOneAndUpdate( { _id: orderId, status: "unassigned" }, { status: "accepted", assignedTo: deliveryId }, { new: true } );

    if (!accepted) {
      socket.emit("acceptFailed", { orderId });
      return;
    }

    io.to(`delivery:${deliveryId}`).emit("orderAssigned", accepted);
    io.to(`customer:${accepted.customer}`).emit("orderAssigned", accepted);
    io.to("admin").emit("orderAssigned", accepted);
  });

  socket.on("updateStatus", async ({ orderId, status, deliveryId }) => {
    const Order = require("../models/Order");

    const updated = await Order.findOneAndUpdate( { _id: orderId, assignedTo: deliveryId }, { status }, { new: true } );

    if (!updated) {
      socket.emit("statusUpdateFailed", { orderId });
      return;
    }

    io.to(`customer:${updated.customer}`).emit("orderUpdated", updated);
    io.to("admin").emit("orderUpdated", updated);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });

  socket.on("productCreated", (product) => {
    console.log("Product Created:", product._id);

    io.emit("productCreated", product);

    io.to("admin").emit("productCreated", product);
  });

  socket.on("productUpdated", (product) => {
    console.log("Product Updated:", product._id);

    io.emit("productUpdated", product);
    io.to("admin").emit("productUpdated", product);
  });

  socket.on("productDeleted", (productId) => {
    console.log("Product Deleted:", productId);

    io.emit("productDeleted", productId);
    io.to("admin").emit("productDeleted", productId);
  });

};
