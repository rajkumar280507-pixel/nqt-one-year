# NQT One-Year 🎓 (TCS NQT 2026 Structured Prep PWA)

NQT One-Year is a Progressive Web Application (PWA) designed to provide a comprehensive, daily-structured 365-day curriculum for Indian engineering students preparing for the TCS NQT 2026. The app features structured concepts, daily practice questions, full-length monthly mock tests, an in-browser code editor/compiler sandbox, and comprehensive analytics charts.

---

## 🛠️ Technology Stack & Architecture

- **Frontend**: React.js, Tailwind CSS, Lucide icons, Recharts visualizations
- **Backend**: Node.js, Express.js REST API
- **Database**: PostgreSQL (relational structure for days, topics, questions, coding tasks, user submissions, and mock tests)
- **Deployment**: Render Blueprint YAML configuration supporting Postgres database and static assets distribution
- **Offline Capabilities**: Full PWA manifests and background service workers to cache study paths

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js** (Node 18+ recommended)
- **PostgreSQL** database running locally

### 2. Environment Variables configuration
Clone the `.env.example` file and save as `.env` inside the project root:
```bash
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nqt_db
JWT_SECRET=super_secret_jwt_key
ADMIN_EMAIL=admin@nqt.com
VITE_ADMIN_EMAIL=admin@nqt.com
```

### 3. Install Dependencies
Install packages in the root directory:
```bash
npm install
```

### 4. Seed the Database
Run the seed script to create all schemas and populate Months 1-4 with 120+ days of complete MCQ/DSA content, and placeholders for Months 5-12:
```bash
npm run seed
```

### 5. Running the Application
To run in local development mode:
- **Run Backend API**:
  ```bash
  npm start
  ```
  *(Starts the Express REST server on port 5000)*
  
- **Run Frontend Client**:
  ```bash
  npm run dev
  ```
  *(Starts the Vite dev server with Hot Module Reloading)*

Open the local address shown in the terminal (usually `http://localhost:5173`) in your browser.

---

## 🧪 Automated Testing

To run the automated integration tests that assert all core authentication, day content retrieval, question answering, analytics dashboard, and mock test endpoints:
```bash
npm test
```
The test suite starts its own self-contained server, executes Native Fetch requests, performs assertions, and closes itself.

---

## 🌐 Deployment to Render (Free Tier)

This repository includes a `render.yaml` configuration that sets up the database and Express server automatically using Render Blueprints.

### Step-by-Step Instructions:

1. **Commit and Push**: Ensure all changes are committed and pushed to your GitHub repository.
2. **Obtain Free API Credentials**:
   * **Groq API Key (Primary)**:
     - Go to [Groq Console](https://console.groq.com) (free).
     - Sign in, navigate to **API Keys**, click **Create API Key**, and copy the string (starts with `gsk_`).
   * **Gemini API Key (Fallback)**:
     - Go to [Google AI Studio](https://aistudio.google.com) (free).
     - Sign in, click **Get API key** in the top menu, create a key, and copy it.
3. **Open Render Dashboard**: Go to [Render Dashboard](https://dashboard.render.com).
4. **Deploy Blueprint**:
   * Click the **New +** button on the top right.
   * Select **Blueprint** from the drop-down menu.
   * Connect your GitHub repository (`nqt-one-year`).
5. **Provision Services**:
   * Render reads the `render.yaml` file in the root.
   * It will prompt you to name your blueprint instance (e.g. `nqt-prep`).
   * **Paste Credentials**:
     - Paste your `GROQ_API_KEY` (starts with `gsk_`).
     - Paste your `GEMINI_API_KEY`.
     - Enter your `ADMIN_EMAIL` (this email will have admin rights to manage topic videos and custom questions).
   * Click **Apply** or **Approve** to begin provisioning.
6. **Execution**:
   * Render will build the React assets (`npm run build`), launch the Express server, and create the PostgreSQL instance.
   * Seeding is fully automated on first startup! Once complete, open the site on your phone, click "Add to Home Screen" to install it as a PWA, and begin your preparation!
