require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Product = require("../models/Product");
const User = require("../models/User");

mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB Connected")).catch(err => console.log(err));

const products = [
  {
    name: "Laptop",
    description: "High performance laptop",
    price: 75000,
    images: ["uploads/product_images/laptop.png"],
    stock: 10
  },
  {
    name: "Smartphone",
    description: "Latest model smartphone",
    price: 35000,
    images: ["uploads/product_images/smartphone.png"],
    stock: 20
  },
  {
    name: "Headphones",
    description: "Noise cancelling headphones",
    price: 5000,
    images: ["uploads/product_images/headphone.jpg"],
    stock: 15
  },
  {
    name: "Smartwatch",
    description: "Fitness tracking smartwatch",
    price: 12000,
    images: ["uploads/product_images/smartwatch.png"],
    stock: 25
  },
  {
    name: "Gaming Mouse",
    description: "Ergonomic design mouse",
    price: 2000,
    images: ["uploads/product_images/gaming_mouse.jpg"],
    stock: 30
  }
];

const users = [
  {
    name: "nabil",
    email: "admin@test.com",
    password: "admin@123",
    role: "admin",
  },
  {
    name: "abc",
    email: "abc@del.com",
    password: "abc@123",
    role: "delivery",
    isAvailable: true,
  },
];

async function hashPassword(rawPassword) {
  return await bcrypt.hash(rawPassword, 10);
}

async function seed() {
  try {
    for (let p of products) {
      const exists = await Product.findOne({ name: p.name });

      if (exists) {
        console.log(`Product already exists → ${p.name} (skipped)`);
      } else {
        await Product.create(p);
        console.log(`Inserted Product → ${p.name}`);
      }
    }

    for (let u of users) {
      const exists = await User.findOne({ email: u.email });

      if (exists) {
        console.log(`User already exists → ${u.email} (skipped)`);
      } else {
        const hashed = await hashPassword(u.password);
        await User.create({ ...u, password: hashed });
        console.log(`Inserted User → ${u.email}`);
      }
    }

    mongoose.connection.close();
    console.log("Seeding Completed & DB Connection Closed");
  } catch (err) {
    console.log("Seeding Error:", err);
    mongoose.connection.close();
  }
}

seed();