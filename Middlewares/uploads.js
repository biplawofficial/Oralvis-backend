const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); 
  },
  filename: function (req, file, cb) {
    const suffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, suffix + path.extname(file.originalname)); 
    // suffix + .jpg / .png etc.
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
