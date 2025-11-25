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
    const { items, shipping, paymentMethod } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ message: "Items cannot be empty" });

    // 1️⃣ Validate stock & subtract
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

      // subtract stock
      product.stock -= item.qty;
      await product.save();

      updatedProducts.push(product);

      totalProductPrice += item.price * item.qty;
    }

    // 2️⃣ Extra charges
    const deliveryCharge = 40;
    const tax = Number((totalProductPrice * 0.05).toFixed(2));

    const finalTotal = totalProductPrice + deliveryCharge + tax;

    // 3️⃣ Create order
    const order = await Order.create({
      customer: customerId,
      items,
      total: finalTotal,
      shipping,
      paymentMethod,
      status: "unassigned"
    });

    // 4️⃣ Emit to delivery partners
    const io = req.app.get("io");
    io.to("delivery-available").emit("newOrder", order);

    // 5️⃣ Emit updated stock to ALL customers
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
