# 🐙 Step-by-Step GitHub Push Guide for CampusLift

This guide provides clear, step-by-step terminal commands and instructions to push your **CampusLift** full-stack project to GitHub safely without leaking `.env` secrets or pushing heavy `node_modules` folders.

---

## 📋 Step 1: Pre-Push Security & Status Verification

Before staging files, verify that your `.gitignore` is working properly and sensitive environment files (`.env`, `node_modules/`, `dist/`) will not be pushed to GitHub.

Run the following command in your terminal inside `/Users/nikhilfarand/Documents/campusLift`:

```bash
git status
```

### ✅ Expected `git status` Output:
You should see untracked files like:
- `.env.example`
- `.gitignore`
- `README.md`
- `package.json`
- `backend/` (without `node_modules` or `.env`)
- `frontend/` (without `node_modules` or `.env`)

> 🔒 **Security Warning**: If you see `.env` or `node_modules/` in the output of `git status`, **STOP** and ensure `.gitignore` contains `.env` and `node_modules/`.

---

## 📦 Step 2: Initialize Repository & Stage Files

If you haven't initialized git or committed your files yet:

### 1. Stage all tracked project files
```bash
git add .
```

### 2. Verify staged files before committing
```bash
git status
```
*Ensure all green files are source code and configuration templates (`.env.example`), NOT `.env` secrets or `node_modules`.*

### 3. Create your first Git commit
```bash
git commit -m "feat: Initial release of CampusLift student travel coordination platform"
```

### 4. Ensure default branch is named `main`
```bash
git branch -M main
```

---

## 🌐 Step 3: Create a New GitHub Repository

1. Go to [GitHub New Repository](https://github.com/new) in your web browser.
2. Enter Repository Name: **`campusLift`** (or your preferred name).
3. Choose **Public** or **Private**.
4. **IMPORTANT**: **DO NOT** check any of the initialization options:
   - ❌ *Add a README file* (Uncheck — we already created a custom `README.md`)
   - ❌ *Add .gitignore* (Uncheck — we already updated `.gitignore`)
   - ❌ *Choose a license* (Uncheck)
5. Click **Create repository**.

---

## 🚀 Step 4: Link Remote & Push to GitHub

Copy the HTTPS or SSH repository URL provided by GitHub (e.g., `https://github.com/your-username/campusLift.git`).

Run the following commands in your terminal:

```bash
# 1. Add remote repository URL (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/campusLift.git

# 2. Push code to the main branch
git push -u origin main
```

---

## 🔄 Step 5: How to Push Future Updates

Whenever you make changes to your project in the future, follow this standard 3-step workflow to update your GitHub repository:

```bash
# 1. Check changed files
git status

# 2. Stage changed files
git add .

# 3. Commit changes with a descriptive message
git commit -m "feat: update travel intent UI and admin controls"

# 4. Push updates to GitHub
git push
```

---

## 🛠️ Quick Troubleshooting Commands

### If git complains about existing origin:
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/campusLift.git
```

### If you accidentally staged a `.env` file before pushing:
```bash
git rm --cached backend/.env frontend/.env
git commit -m "fix: remove environment files from staging"
```

*Congratulations! Your CampusLift project is now live on GitHub! 🎉*
