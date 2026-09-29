# E-KAVACH — Local Setup & Execution Guide 🚀

This guide explains how to save, configure, and run the complete **E-KAVACH** application on your local machine (Windows, macOS, or Linux).

---

## 📋 System Prerequisites

Before starting, ensure you have the following installed on your computer:

1. **Node.js**: Version **`18.0.0` or higher** (Version 20 LTS or 22 LTS recommended).
   - Check version: `node -v`
   - Download if needed: [https://nodejs.org/](https://nodejs.org/)
2. **npm**: Version **`9.0.0` or higher** (bundled automatically with Node.js).
   - Check version: `npm -v`
3. A modern web browser (Google Chrome, Microsoft Edge, Brave, or Firefox) for camera/QR scanner permissions.

---

## 📥 Step 1: Save the Project to Your Computer

You can obtain the project files in either of the following ways:

### Method A: Download ZIP from Google AI Studio
1. In Google AI Studio, click the **Settings / Menu** icon (or Export button) in the upper corner.
2. Select **"Download as ZIP"** or **"Export Project"**.
3. Extract the downloaded ZIP archive to a folder on your computer (for example, `C:\Projects\e-kavach` or `~/Projects/e-kavach`).

### Method B: Clone via Git
```bash
git clone https://github.com/Avinesh-Shukla/E-Kavaach.git
cd E-Kavaach
```

---

## ⚡ Step 2: Install Dependencies

Open your terminal or command prompt (PowerShell, Command Prompt, Terminal, or VS Code integrated terminal), navigate into the root project directory, and run:

```bash
npm install
```

> **Note**: E-KAVACH uses an integrated full-stack architecture where all frontend and backend dependencies are managed seamlessly from the root `package.json`.

---

## ⚙️ Step 3: (Optional) Configure Environment Variables

The application runs **100% out of the box with zero external configuration**, using built-in safe defaults and a persistent local database.

If you wish to configure optional settings (such as a custom port or your free Google Gemini API key for AI-assisted clinical triage):

1. Copy `.env.example` to a new file named `.env`:
   - **Windows (Command Prompt)**:
     ```cmd
     copy .env.example .env
     ```
   - **macOS / Linux / PowerShell**:
     ```bash
     cp .env.example .env
     ```
2. Open `.env` in any text editor:
   ```env
   # Unified Server Port (Default is 3000)
   PORT=3000

   # Optional: Get a free key at https://aistudio.google.com/app/apikey
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

---

## 🚀 Step 4: Run the Application Locally

Start both the **backend API server**, **real-time WebSocket telemetry engine**, and **Vite frontend** with a single command:

```bash
npm run dev
```

You will see output similar to:
```text
✅ Real-time telemetry WebSocket service attached to HTTP server
✅ Vite middleware mounted serving root E-KAVACH frontend
🚀 E-KAVACH integrated fullstack server listening on http://0.0.0.0:3000
```

Now open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🏥 Portals & Demo Accounts

E-KAVACH includes three interconnected healthcare workspaces:

| Portal | URL Path | Description & Features |
|---|---|---|
| **Patient Portal** | `http://localhost:3000/patient` | ABHA Health ID card, digital emergency health pass, appointments, consent management, and PM-JAY scheme eligibility. |
| **Doctor Console** | `http://localhost:3000/doctor` | Rapid ER triage queue, golden-hour QR scanner, patient onboarding, specialist consultation network, and prescription management. |
| **Hospital Admin Hub** | `http://localhost:3000/admin` | Real-time ICU & ward bed occupancy grid, emergency diversions, doctor & staff rosters, pharmacy inventory, and inter-hospital regional grid. |

### Quick Login / Demo Access:
- The landing page (`http://localhost:3000/`) allows instant role selection and demo switching.
- Sample patient records (e.g., Rajesh Kumar, Meera Patel, Vikram Singh) and trauma centers are pre-seeded in the database.

---

## 💾 How Data Persistence Works Locally

- **Zero-Setup Database**: The backend utilizes an integrated persistent file store located at `e-kavach-backend/src/database/local_db.json`.
- **Automatic Saving**: Any patient registered, appointment booked, triage entry updated, or bed status modified is instantly saved to your local disk.
- **Relational / PostgreSQL Support**: If you prefer PostgreSQL, a complete Prisma schema is provided in `e-kavach-backend/prisma/schema.prisma`. You can connect your database by setting `DATABASE_URL` in `.env` and running `npx prisma db push`.

---

## 📦 Production Build & Deployment

To verify or test a production bundle locally:

```bash
# 1. Build optimized frontend and bundled backend server
npm run build

# 2. Run the production server
npm start
```
The server will serve the static production build directly on `http://localhost:3000`.

---

## 🛠️ Common Troubleshooting

### 1. "Port 3000 is already in use"
If another program is using port 3000, you can run E-KAVACH on another port:
- **Windows (PowerShell)**:
  ```powershell
  $env:PORT="3005"; npm run dev
  ```
- **macOS / Linux**:
  ```bash
  PORT=3005 npm run dev
  ```
Then visit `http://localhost:3005`.

### 2. "EACCES or Permission Denied"
Ensure you have write permissions in the project directory, particularly for the `uploads/` directory and `e-kavach-backend/src/database/` directory.

### 3. QR Camera Permissions
When testing the camera QR scanner in the Doctor portal, make sure to click **"Allow"** when your browser prompts for webcam/camera access.

---

## 📂 Project Architecture Overview

```text
E-KAVACH/
├── server.ts                  # Unified server orchestrating Express API & Vite HMR
├── package.json               # Root scripts, fullstack dependencies
├── LOCAL_SETUP.md             # This guide
├── .env.example               # Template for local environment variables
├── src/                       # React 19 + Tailwind CSS frontend application
│   ├── pages/                 # Patient, Doctor, Admin, and Landing views
│   ├── components/            # Reusable UI cards, triage widgets, modals
│   ├── services/              # Real-time WebSocket telemetry & client helpers
│   └── context/               # AuthContext & session state management
├── e-kavach-backend/          # Node.js/Express backend service
│   ├── src/
│   │   ├── app.js             # Express app configuration & middleware
│   │   ├── routes/            # REST API endpoints (/auth, /patient, /doctor, /admin)
│   │   ├── services/          # Socket.io telemetry & real-time broadcast engine
│   │   └── database/          # Persistent local database & Delhi hospital dataset
│   └── prisma/                # Prisma schema for optional PostgreSQL deployment
└── uploads/                   # Local storage for patient medical records & scans
```
