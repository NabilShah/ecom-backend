const Product = require("../models/Product");
const Order = require("../models/Order");


// -------------------------------
// GET ALL PRODUCTS
// -------------------------------
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// -------------------------------
// GET PRODUCT BY ID
// -------------------------------
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(product);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// -------------------------------
// PLACE ORDER
// -------------------------------
exports.placeOrder = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { items } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ message: "Items cannot be empty" });

    // Calculate total
    let total = 0;
    for (let item of items) {
      total += item.price * item.qty;
    }

    const order = await Order.create({
      customer: customerId,
      items,
      total,
      status: "unassigned"
    });

    // Emit event to delivery partners
    const io = req.app.get("io");
    io.to("delivery-available").emit("newOrder", order);

    res.json({
      message: "Order placed successfully",
      order
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// -------------------------------
// GET CUSTOMER ORDERS
// -------------------------------
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id })
      .populate("items.product", "name price")
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// -------------------------------
// GET ORDER BY ID
// -------------------------------
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user.id
    })
      .populate("items.product", "name price")
      .populate("assignedTo", "name phone");

    if (!order)
      return res.status(404).json({ message: "Order not found" });

    res.json(order);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
