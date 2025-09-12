# OralVis Backend 🦷

This repository contains the backend service for the **OralVis Healthcare System**. It is a Node.js application built with Express and MongoDB, designed to handle patient submissions, dental professional annotations, and automated PDF report generation.

## ✨ Features

-   **User Authentication**: Secure JWT-based authentication for `patient` and `admin` roles.
-   **Role-Based Access Control**: Differentiated API endpoints for patients and dental professionals.
-   **File Uploads**: Handles multi-image uploads from patients using Multer.
-   **Data Management**: CRUD operations for patient submissions stored in MongoDB.
-   **Image Annotation**: Saves annotation data (coordinates, findings, notes) submitted by admins.
-   **Dynamic PDF Reporting**: Generates comprehensive oral health reports with annotated images using `pdfkit` and `sharp`.

## 🛠️ Tech Stack

-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: MongoDB with Mongoose
-   **Authentication**: JSON Web Tokens (jsonwebtoken), bcryptjs
-   **File Handling**: Multer (for uploads), Sharp (for image processing)
-   **PDF Generation**: PDFKit

---

## 🚀 Getting Started

Follow these instructions to get the backend server up and running on your local machine.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v14 or later)
-   [MongoDB](https://www.mongodb.com/try/download/community) installed and running.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd Oralvis-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create an environment file:**
    Create a `.env` file in the root of the `Oralvis-backend` directory and add the following variables.

    ```env
    # Your MongoDB connection string
    MONGO_URI=mongodb://localhost:27017/oralvis

    # A strong, secret key for signing JWT tokens
    JWT_SECRET=YOUR_SUPER_SECRET_KEY

    # The port for the server to run on
    PORT=3001
    ```

4.  **Start the server:**
    ```bash
    npm start
    ```

The server will be running at `http://localhost:3001`.

---

## 📖 API Documentation

The following are the available API endpoints.

### Authentication (`/auth`)

#### `POST /auth/register`
Registers a new user (patient or admin).

-   **Request Body:**
    ```json
    {
      "name": "John Doe",
      "email": "patient@example.com",
      "password": "password123",
      "role": "patient"
    }
    ```
-   **Success Response (201):**
    ```json
    {
      "message": "User registered successfully",
      "token": "jwt.token.string",
      "user": {
        "id": "60d0fe4f5311236168a109ca",
        "name": "John Doe",
        "email": "patient@example.com",
        "role": "patient"
      }
    }
    ```

#### `POST /auth/login`
Logs in an existing user.

-   **Request Body:**
    ```json
    {
      "email": "admin@oralvis.com",
      "password": "admin123"
    }
    ```
-   **Success Response (201):**
    ```json
    {
      "message": "Logged In Successfully",
      "token": "jwt.token.string",
      "user": {
        "id": "60d0fe4f5311236168a109cb",
        "name": "Admin User",
        "email": "admin@oralvis.com",
        "role": "admin"
      }
    }
    ```

### Patient Endpoints (`/patient`)
*(Requires Patient Authentication)*

#### `POST /patient/upload`
Uploads a new submission with 3 images.

-   **Request Body**: `multipart/form-data`
    -   `patientID`: `String`
    -   `name`: `String`
    -   `email`: `String`
    -   `phone`: `String`
    -   `note`: `String` (optional)
    -   `images`: `File[]` (exactly 3 image files)
-   **Success Response (201):**
    ```json
    {
      "message": "Submission uploaded successfully",
      "submission": {
        "_id": "60d0fe4f5311236168a109cc",
        "userId": "60d0fe4f5311236168a109ca",
        "patientID": "P12345",
        "name": "Jane Smith",
        "status": "uploaded",
        "imageURLs": ["uploads/image1.png", "uploads/image2.png", "uploads/image3.png"]
      }
    }
    ```

#### `GET /patient/submissions`
Fetches all submissions for the logged-in patient.

-   **Success Response (200):** An array of submission objects.

#### `GET /patient/submission/:id/report`
Downloads the generated PDF report for a specific submission.

-   **Success Response (200):** A PDF file stream.

### Admin Endpoints (`/admin`)
*(Requires Admin Authentication)*

#### `GET /admin/submissions`
Fetches all patient submissions.

-   **Success Response (200):** An array of all submission objects.

#### `POST /admin/submission/:id/annotate`
Saves findings and annotation data for a submission.

-   **URL Params**: `:id` (Submission ID)
-   **Request Body**:
    ```json
    {
      "findings": {
        "upperTeeth": "Mild plaque observed.",
        "frontTeeth": "No visible issues.",
        "lowerTeeth": "Slight inflammation on the lower gums.",
        "recededGums": true,
        "stains": false,
        "attrition": false,
        "crowns": true,
        "otherFindings": "Patient reports sensitivity to cold.",
        "annotations": [
          {
            "annotations": [
              { "type": "rectangle", "x": 100, "y": 150, "width": 50, "height": 30, "color": "#D33E3E" }
            ]
          },
          { "annotations": [] },
          { "annotations": [] }
        ]
      }
    }
    ```
-   **Success Response (200):**
    ```json
    {
      "message": "Submission Annotated!",
      "submission": { ...updated submission object... }
    }
    ```

#### `POST /admin/submission/:id/generate-report`
Generates and saves a PDF report for a submission.

-   **URL Params**: `:id` (Submission ID)
-   **Success Response (200):** A PDF file stream for direct download.

## 📜 License
This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.
