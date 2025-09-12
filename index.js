const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authenticationRoute");
const patientRoutes = require("./routes/patientRoute");
const adminRoutes = require("./routes/adminViewRoute");
const path = require("path");
const PORT = process.env.PORT || 3001;
dotenv.config();

const app = express();

app.use(cors({ 
  origin: 'https://oralvis-frontend-one.vercel.app', 
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/auth", authRoutes);
app.use("/patient", patientRoutes);
app.use("/admin", adminRoutes);
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB connection error:", err));
app.get("/health", (req, res) => {
  console.log("Health Check Passed");
  res.send("Health Check Passed!");
});
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
