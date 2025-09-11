const express = require("express");
const router = express.Router();
const Submission = require("../userModels/submission");
const auth = require("../Middlewares/auth");
const upload = require("../Middlewares/uploads");
const path = require("path");

router.post("/upload", auth("patient"), upload.array("images", 3), async (req, res) => {
  try {
    const { patientID, name, email, phone, note } = req.body;
    if (!patientID || !name || !email || !phone || !req.files || req.files.length !== 3) {
      return res.status(400).json({ message: "All fields are required and exactly 3 images needed!" });
    }
    const submission = new Submission({
      userId: req.user.id,
      patientID,
      name,
      email,
      phone,
      note,
      imageURLs: req.files.map((file) => file.path),
      annotatedImageURLs: [],
      reportURL: "",
      status: "uploaded",
    });

    await submission.save();
    return res.status(201).json({ message: "Submission uploaded successfully", submission });
  } catch (error) {
    console.error("Patient upload error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

router.get("/submissions", auth("patient"), async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId)
    const submissions = await Submission.find({userId:userId}).sort({ createdAt: -1 });
    if (!submissions || submissions.length === 0) {
      return res.status(404).json({ message: "No submissions found for this user" });
    }
    res.json(submissions);
  } catch (error) {
    console.error("Patient submissions error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
});

router.get("/submission/:id", auth("patient"), async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found!" });
    }

    res.json(submission);
  } catch (error) {
    console.error("Patient get submission error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
});


router.get("/submission/:id/report", auth("patient"), async (req, res) => {
  try {
    console.log("req encountered")
    const submission = await Submission.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!submission || !submission.reportURL) {
      console.log("submission not found!")
      return res.status(404).json({ message: "Report not found!" });

    }

    const reportPath = path.join(__dirname, "..", submission.reportURL);
    console.log("sending report to frontend")
    return res.sendFile(reportPath);
  } catch (error) {
    console.error("Patient get report error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
});

module.exports = router;
