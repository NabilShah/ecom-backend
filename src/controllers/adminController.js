const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, images, stock } = req.body;

    const product = await Product.create({ name, description, price, images, stock, });

    req.app.get("io").emit("productCreated", product);

    res.json({
      message: "Product created successfully",
      product,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Product.findByIdAndUpdate(id, req.body, { new: true });

    if (!updated)
      return res.status(404).json({ message: "Product not found" });

    req.app.get("io").emit("productUpdated", updated);

    req.app.get("io").emit("stockUpdated", {
      productId: updated._id,
      stock: updated.stock,
    });

    res.json({
      message: "Product updated successfully",
      product: updated,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted)
      return res.status(404).json({ message: "Product not found" });

    req.app.get("io").emit("productDeleted", id);

    res.json({ message: "Product deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("customer", "name email phone").populate("assignedTo", "name phone email").sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrderByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).populate("customer", "name email phone").populate("assignedTo", "name phone");

    if (!order)
      return res.status(404).json({ message: "Order not found" });

    res.json(order);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDeliveryPartners = async (req, res) => {
  try {
    const partners = await User.find({ role: "delivery" }).select("name email phone isAvailable");

    res.json(partners);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLiveStatuses = async (req, res) => {
  try {
    const counts = {
      unassigned: await Order.countDocuments({ status: "unassigned" }),
      accepted: await Order.countDocuments({ status: "accepted" }),
      picked_up: await Order.countDocuments({ status: "picked_up" }),
      on_the_way: await Order.countDocuments({ status: "on_the_way" }),
      delivered: await Order.countDocuments({ status: "delivered" }),
      cancelled: await Order.countDocuments({ status: "cancelled" }),
    };

    res.json(counts);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};