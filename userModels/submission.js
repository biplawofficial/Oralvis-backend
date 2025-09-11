const mongoose = require("mongoose");
const subSchema = mongoose.Schema({
    userId:{type:String, required:true},
    patientID: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    note: { type: String },
    imageURLs: [{ type: String, required: true }],
    annotatedImageURLs: [{ type: String }],
    reportURL: { type: String },
    findings: {
        upperTeeth: { type: String, default: "" },
        frontTeeth: { type: String, default: "" },
        recededGums: { type: Boolean, default: false },
        stains: { type: Boolean, default: false },
        attrition: { type: Boolean, default: false },
        lowerTeeth: { type: String, default: "" },
        crowns: { type: Boolean, default: false },
        otherFindings: { type: String, default: "" },
        annotations: [{
            imageType: { type: String, enum: ['upper', 'front', 'lower'] },
            annotations: [Object]
        }]
    },
    recommendations: {
        inflamedGums: { type: String, default: "Scaling" },
        malaligned: { type: String, default: "Braces or Clear Aligner" },
        recededGums: { type: String, default: "Gum Surgery" },
        stains: { type: String, default: "Teeth cleaning and polishing" },
        attrition: { type: String, default: "Filling/ Night Guard" },
        crowns: { type: String, default: "If the crown is loose or broken, better get it checked. Teeth coloured caps are the best ones." },
        otherRecommendations: { type: String, default: "" }
    },
    status: { type: String, enum: ["uploaded", "annotated", "reported"], required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("submission", subSchema);