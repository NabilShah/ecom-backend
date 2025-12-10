require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const adminRoutes = require("./routes/adminRoutes");

const orderSocket = require("./sockets/orderSocket");

const app = express();
const server = http.createServer(app);
const CLIENT_URLS = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",").map(url => url.trim()) : [];


app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (CLIENT_URLS.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

const io = require("socket.io")(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (CLIENT_URLS.includes(origin)) return callback(null, true);
      callback(new Error("Socket.IO CORS blocked"));
    },
    credentials: true,
  },
});

app.use(express.json());
app.use(morgan("dev"));

app.use("/uploads", express.static("uploads"));

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/admin", adminRoutes);

app.set("io", io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  orderSocket(socket, io);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));