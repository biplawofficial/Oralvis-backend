const Submission = require("../userModels/submission");
const auth = require("../Middlewares/auth");
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const generateOralHealthReport = require("../utils/pdfGenerator");
const upload = require("../Middlewares/uploads"); // multer instance

// GET all submissions (admin)
router.get("/submissions", auth("admin"), async (req, res) => {
  try {
    const response = await Submission.find().sort({ createdAt: -1 });
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message || error });
  }
});

// GET single submission (admin)
router.get("/submission/:id", auth("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "Missing ID!" });
    const response = await Submission.findById(id);
    if (!response) return res.status(404).json({ message: "Submission not found!" });
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message || error });
  }
});
router.post(
  "/submission/:id/annotate",
  auth("admin"),
  upload.any(),
  async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ message: "Missing submission id param" });

      const submission = await Submission.findById(id);
      if (!submission) return res.status(404).json({ message: "Submission Not Found!" });
      const rawBody = req.body || {};
      let findings = null;
      if (rawBody.findings) {
        if (typeof rawBody.findings === "string") {
          try {
            findings = JSON.parse(rawBody.findings);
          } catch (e) {
            findings = rawBody.findings;
          }
        } else {
          findings = rawBody.findings;
        }
      } else {
        const maybeFindings = ["upperTeeth","frontTeeth","lowerTeeth","recededGums","stains","attrition","crowns","otherFindings","annotations"];
        const hasFindingsKeys = Object.keys(rawBody).some(k => maybeFindings.includes(k));
        findings = hasFindingsKeys ? rawBody : submission.findings || {};
      }
      if (findings && findings.annotations && typeof findings.annotations === "string") {
        try {
          findings.annotations = JSON.parse(findings.annotations);
        } catch (e) {
        }
      }
      if (!findings) findings = {};
      if (!Array.isArray(findings.annotations)) {
        if (submission.findings && Array.isArray(submission.findings.annotations)) {
          findings.annotations = submission.findings.annotations;
        } else if (Array.isArray(submission.imageURLs) && submission.imageURLs.length > 0) {
          findings.annotations = submission.imageURLs.map(() => ({ annotations: [] }));
        } else {
          findings.annotations = [];
        }
      }

      submission.findings = findings;
      submission.status = "annotated";
      await submission.save();

      return res.json({ message: "Submission Annotated!", submission });
    } catch (error) {
      console.error("Annotate error:", error);
      return res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

router.post("/submission/:id/generate-report", auth("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "Missing submission id param" });
    const submission = await Submission.findById(id);
    if (!submission) return res.status(404).json({ message: "Submission Not Found!" });
    const pdfFileName = `report-${submission._id}-${Date.now()}.pdf`;
    const reportsDir = path.join(__dirname, "../uploads/reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const pdfPath = path.join(reportsDir, pdfFileName);
    await generateOralHealthReport(submission, pdfPath);
    submission.reportURL = `/uploads/reports/${pdfFileName}`;
    submission.status = "reported";
    await submission.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${submission.patientID || submission._id}.pdf"`);
    
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
    fileStream.on('close', () => {
    });
  } catch (error) {
    console.error("Generate report error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
});
router.get("/submission/:id/report", auth("admin"), async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "Missing ID!" });

    const submission = await Submission.findById(id);
    if (!submission || !submission.reportURL) {
      return res.status(404).json({ message: "Report not found!" });
    }

    const reportPath = path.join(__dirname, "..", submission.reportURL);
    
    // Check if file exists
    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({ message: "Report file not found!" });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="report-${id}.pdf"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(reportPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Get report error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
});


router.post("/get-image", auth("admin"), (req, res) => {
  try {
    const imagePath = req.body && req.body.imagePath;
    if (!imagePath) {
      return res.status(400).json({ message: "imagePath is required in request body" });
    }
    
    const absolutePath = path.join(__dirname, "..", imagePath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: "Image not found" });
    }
    
    const ext = path.extname(absolutePath).toLowerCase();
    let contentType = 'image/jpeg'; // default
    
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    
    res.setHeader('Content-Type', contentType);
    
    const fileStream = fs.createReadStream(absolutePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("get-image error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
});


module.exports = router;
