const Product = require("../models/Product");
const Order = require("../models/Order");

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(product);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.placeOrder = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { items, shipping, paymentMethod } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ message: "Items cannot be empty" });

    let totalProductPrice = 0;
    let updatedProducts = [];

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product)
        return res.status(404).json({ message: `Product not found: ${item.product}` });

      if (product.stock < item.qty)
        return res.status(400).json({
          message: `Not enough stock for ${product.name}, available: ${product.stock}`
        });

      product.stock -= item.qty;
      await product.save();

      updatedProducts.push(product);

      totalProductPrice += item.price * item.qty;
    }

    const deliveryCharge = 40;
    const tax = Number((totalProductPrice * 0.05).toFixed(2));

    const finalTotal = totalProductPrice + deliveryCharge + tax;

    const order = await Order.create({ customer: customerId, items, total: finalTotal, shipping, paymentMethod, status: "unassigned" });

    const io = req.app.get("io");

    const populatedOrder = await Order.findById(order._id).populate("customer", "name email phone").populate("assignedTo", "name email phone");

    io.to("delivery-available").emit("newOrder", populatedOrder);
    io.to("admin").emit("newOrder", populatedOrder);

    updatedProducts.forEach((product) => {
      io.emit("stockUpdated", {
        productId: product._id,
        stock: product.stock
      });
    });

    res.json({
      message: "Order placed successfully",
      order
    });

  } catch (err) {
    console.error("Order error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id }).populate("items.product", "name price").sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user.id }).populate("items.product", "name price").populate("assignedTo", "name phone email");

    if (!order)
      return res.status(404).json({ message: "Order not found" });

    res.json(order);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findOne({ _id: orderId, customer: req.user.id }).populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (["delivered", "cancelled"].includes(order.status)) {
      return res.status(400).json({ message: "Order cannot be cancelled" });
    }

    for (const item of order.items) {
      const product = await Product.findById(item.product._id);
      product.stock += item.qty;
      await product.save();
    }

    order.status = "cancelled";
    await order.save();

    const io = req.app.get("io");

    const populated = await Order.findById(order._id).populate("customer", "name email phone").populate("assignedTo", "name email phone");

    io.to(`customer:${order.customer.toString()}`).emit("orderUpdated", populated);

    io.to("admin").emit("orderUpdated", populated);
    io.to("delivery-available").emit("orderUpdated", populated);   // 👈 NEW
    io.emit("orderUpdated", populated);

    order.items.forEach((item) => {
      io.emit("stockUpdated", {
        productId: item.product._id,
        stock: item.product.stock
      });
    });

    return res.json({
      message: "Order cancelled successfully",
      order
    });

  } catch (err) {
    console.error("Cancel error:", err);
    res.status(500).json({ error: err.message });
  }
};