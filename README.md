# Choice Tailors - Shop Management Portal

A modern tailoring shop management portal built for tracking custom stitching orders, customer profiles, payment ledgers, and automated receipt generation.

## 🔗 Live Application Links
* **Live Website**: [https://choice-tailor.onrender.com](https://choice-tailor.onrender.com)
* **Live Backend API**: [https://choice-tailors-backend.onrender.com](https://choice-tailors-backend.onrender.com)

---

## 🚀 Key Features

* **Dashboard Overview**: View key shop metrics (total billing, paid collections, and active queue counts) with full-width analytics.
* **Customer Hub**: Create, edit, and delete customer profiles. Track individual lifetime order histories and outstanding payment dues.
* **Stitching Queue**: Track garments by status (`Pending`, `Cutting`, `Stitching`, `Trial`, `Completed`, `Delivered`).
* **Automated Receipts**: Compile beautiful PDF invoices dynamically using ReportLab.
* **WhatsApp Share**: One-click redirection to send bills or measurement details directly to customers on WhatsApp Web.
* **Dual Database Engine**: Automatically uses **MongoDB Atlas** for secure cloud storage, with a silent local **SQLite** fallback if the cloud cluster is offline.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js (React), Tailwind CSS, Framer Motion, Recharts
* **Backend**: FastAPI (Python), Motor (Async MongoDB), PyJWT (Authentication)
* **Database**: MongoDB Atlas (Cloud) / SQLite (Local Fallback)

---

## 💻 Local Setup Instructions

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend/` folder and configure your variables:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/choice_tailors?retryWrites=true&w=majority
   JWT_SECRET=your_secure_jwt_secret_key_here
   ```
5. Start the backend development server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the `frontend/` folder:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🌐 Production Deployment (Render)

For step-by-step production deployment instructions to deploy both the backend and frontend on Render, please refer to the **[DEPLOY_INSTRUCTIONS.md](DEPLOY_INSTRUCTIONS.md)** file at the root of this project.
