const multer = require("multer");
const path = require("path");

// storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/product_images"); // folder
  },
  filename: function (req, file, cb) {
    // const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // cb(null, uniqueName + path.extname(file.originalname));
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

module.exports = upload;
