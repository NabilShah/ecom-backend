require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");

// routes
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const adminRoutes = require("./routes/adminRoutes");

// socket handlers
const orderSocket = require("./sockets/orderSocket");

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Serve uploaded images
app.use("/uploads", express.static("uploads"));

// DB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/admin", adminRoutes);

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Socket.IO
const io = require("socket.io")(server, {
  cors: { origin: "*" },
});

// attach io globally so controllers can emit
app.set("io", io);

// socket connections
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  orderSocket(socket, io);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
