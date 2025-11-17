const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      qty: Number,
      price: Number,
    },
  ],

  total: Number,
  
  status: {
    type: String,
    enum: [
      "unassigned",
      "accepted",
      "picked_up",
      "on_the_way",
      "delivered",
      "cancelled"
    ],
    default: "unassigned"
  },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", OrderSchema);
