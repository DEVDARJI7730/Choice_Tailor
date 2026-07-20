# Choice Tailors (TailorPro AI) - Smart Tailor Management System

This repository digitizes **Choice Tailors** (Gandhi Chok, Kadi) tailoring business operation with an AI-Powered Customer Management, Bespoke Measurements Registry, Multi-item Order Pipeline, and GST-ready Billing receipt PDF generator.

---

## Technical Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Python FastAPI, JWT Auth, WebSockets
- **Database**: MongoDB Atlas or Local SQLite Fallback
- **AI Engine**: Google Gemini API Integration

---

## Directory Structure

```text
choice-tailors/
├── docker-compose.yml       # Local MongoDB compose file
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application server entrypoint
│   │   ├── config.py        # Settings configuration and OS directories
│   │   ├── database.py      # MongoDB with SQLite fallback adapter
│   │   ├── seed.py          # Seeding script with dummy clients and measurements
│   │   └── routers/
│   │       ├── auth.py      # Login and JWT security token router
│   │       ├── customers.py # Customers CRUD and photo attachments upload router
│   │       ├── orders.py    # Order builder and status progression router
│   │       ├── billing.py   # PDF invoices billing compiler router
│   │       ├── ai.py        # AI Assistant: Measurement variance, workload and WhatsApp draft router
│   │       └── reports.py   # Sales reports router (Excel file compiler)
│   └── requirements.txt     # Python backend dependencies
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Sidebar.tsx  # Common premium layout sidebar navigation
    │   └── app/
    │       ├── layout.tsx   # Base fonts layout
    │       ├── globals.css  # Velvet and Gold custom tailwind glassmorphic styles
    │       ├── page.tsx     # Choice Tailors secure login screen
    │       ├── dashboard/   # Dashboard analytical panels
    │       ├── customers/   # Clients registry search and edit panels
    │       ├── measurements/# Body-diagram templates sizing board
    │       ├── orders/      # Kanban status order tracking boards
    │       └── billing/     # Invoice compiler and print invoice builder
    ├── package.json         # Next.js 15 packages
    ├── tailwind.config.js   # TailorPro theme color definitions
    ├── tsconfig.json        # TypeScript configuration
    └── next.config.js       # Next.js settings
```

---

## Setup Instructions

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **Python**: `v3.10` or higher
- **Docker** (Optional, for running MongoDB database locally)

### 2. Run Backend API Server

1. Open your terminal, change directory to `backend/`:
   ```bash
   cd backend
   ```
2. Install Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Set environment parameters in a `.env` file (Optional):
   ```ini
   MONGODB_URI=mongodb://localhost:27017
   GEMINI_API_KEY=YOUR_GEMINI_KEY
   ```
4. Run DB Seeder script to load mock data:
   ```bash
   python app/seed.py
   ```
5. Run the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   *The API will be running on `http://127.0.0.1:8000`*

### 3. Run Frontend Server

1. Open another terminal session, change directory to `frontend/`:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js local dev server:
   ```bash
   npm run dev
   ```
   *The app UI will be visible at `http://localhost:3000`*

### 4. Admin Access Portal Credentials
- **Username**: `choice.kadi@gmail.com`
- **Password**: `Choice@123`
