# Choice Tailors - Render Deployment Guide

Follow these steps to push your project to GitHub and deploy both the backend and frontend on Render. 

---

## Step 1: Push Code to GitHub

We have created a root `.gitignore` file that prevents credential leakage (your `.env` files), `node_modules`, `.next` caches, and local databases from being pushed to GitHub.

1. Open your terminal at the root directory of your project:
   `C:\Users\Dev\OneDrive\Desktop\choice-tailors`
2. Initialize Git and commit your files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for production deployment"
   ```
3. Go to [GitHub](https://github.com/) and create a new repository (e.g. `choice-tailors`). Leave it empty (do NOT add a README, license, or gitignore there).
4. Run the commands shown on GitHub to link and push your repository:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```

---

## Step 2: Deploy Backend Web Service on Render

1. Go to [Render](https://render.com/) and log in.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Configure the Web Service:
   * **Name**: `choice-tailors-backend`
   * **Root Directory**: `backend`
   * **Language**: `Python`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Scroll down to **Environment Variables** (or click the *Environment* tab) and add:
   * **`MONGODB_URI`**: `mongodb+srv://<username>:<password>@<your-cluster>.mongodb.net/choice_tailors?retryWrites=true&w=majority`
   * **`JWT_SECRET`**: `choice_tailors_super_secret_key_12345`
6. Click **Deploy Web Service**.
7. Once deployed, **copy your Backend URL** (e.g., `https://choice-tailors-backend.onrender.com`). You will need this for the frontend!

---

## Step 3: Deploy Frontend Web Service on Render

1. On the Render Dashboard, click **New +** and select **Web Service** (or Static Site, but Web Service is recommended for Next.js SSR/API routing).
2. Connect the same GitHub repository.
3. Configure the Web Service:
   * **Name**: `choice-tailors-frontend`
   * **Root Directory**: `frontend`
   * **Language**: `Node`
   * **Build Command**: `npm run build`
   * **Start Command**: `npm run start`
4. Scroll down to **Environment Variables** and add:
   * **`NEXT_PUBLIC_API_URL`**: `https://YOUR_BACKEND_URL_FROM_RENDER.onrender.com` (Use the actual URL you copied in Step 2).
5. Click **Deploy Web Service**.

Once the build finishes, your site is live! You can access it through the frontend Render URL.
