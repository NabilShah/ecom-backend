const mongoose = require("mongoose");
const Product = require("../models/Product"); // your model file

mongoose.connect("mongodb://localhost:27017/db_ecommerce")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const products = [
  {
    name: "Laptop",
    description: "High performance laptop",
    price: 75000,
    images: ["laptop.png"],
    stock: 10
  },
  {
    name: "Smartphone",
    description: "Latest model smartphone",
    price: 35000,
    images: ["smartphone.png"],
    stock: 20
  },
  {
    name: "Headphones",
    description: "Noise cancelling headphones",
    price: 5000,
    images: ["headphone.jpg"],
    stock: 15
  },
  {
    name: "Smartwatch",
    description: "Fitness tracking smartwatch",
    price: 12000,
    images: ["smartwatch.png"],
    stock: 25
  },
  {
    name: "Gaming Mouse",
    description: "Ergonomic design mouse",
    price: 2000,
    images: ["gaming_mouse.jpg"],
    stock: 30
  }
];

Product.insertMany(products)
  .then(() => {
    console.log("Products inserted successfully");
    mongoose.connection.close();
  })
  .catch(err => console.log(err));
