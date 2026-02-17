# OralVis Backend 🦷

The server-side application for the OralVis Healthcare System. A Node.js/Express REST API that handles authentication, image storage, annotation data, and PDF report generation.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT & Passport.js
- **Image Processing**: Sharp
- **PDF Generation**: PDFKit

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14+)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally or cloud URI)

### Installation

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Environment Setup:**
    Create a `.env` file in this directory:

    ```env
    MONGO_URI=mongodb://localhost:27017/oralvis
    JWT_SECRET=your_super_secret_key
    PORT=3001
    ```

3.  **Start the Server:**
    ```bash
    npm start
    ```
    The server will run on [http://localhost:3001](http://localhost:3001).

## 📡 API Endpoints Summary

### Auth (`/auth`)

- `POST /register`: Register new user (Patient/Admin).
- `POST /login`: Login user.

### Patient (`/patient`)

- `POST /upload`: Upload images (Multipart).
- `GET /submissions`: Get user's submissions.
- `GET /submission/:id/report`: Download PDF report.

### Admin (`/admin`)

- `GET /submissions`: Get all submissions.
- `POST /submission/:id/annotate`: Save annotation findings.
- `POST /submission/:id/generate-report`: Generate PDF.

## 📂 Key Directory Structure

```
Oralvis-backend/
├── Middlewares/    # Auth verification & File Upload (Multer)
├── routes/         # API Route definitions
├── userModels/     # Mongoose Schemas (User, Submission)
├── utils/          # pdfGenerator.js (PDF creation logic)
└── uploads/        # Directory for stored images & reports
```
