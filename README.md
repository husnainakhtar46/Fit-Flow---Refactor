# Fit-Flow QMS (Refactored)

An enterprise **Quality Management System (QMS)** for apparel and garment manufacturing, refactored into **Next.js 15 (App Router, Tailwind CSS, TypeScript, PWA)** and a **clean, modular Django REST Framework backend**.

---

## 📖 Architecture & Developer Guide

For a complete breakdown of every file, domain responsibility, data flow, and directory structure, please read:

👉 **[`ARCHITECTURE.md`](./ARCHITECTURE.md)**

---

## 🚀 Quick Start Guide (PowerShell)

### 1. Python Virtual Environment
This project uses the centralized virtual environment located at:
```powershell
D:\Office\Scripts\.venv
```

#### Activate the Virtual Environment in PowerShell:
```powershell
& "D:\Office\Scripts\.venv\Scripts\Activate.ps1"
```
*Or invoke the Python executable directly without activation:*
```powershell
& "D:\Office\Scripts\.venv\Scripts\python.exe" manage.py <command>
```

---

### 2. Run the Backend (Django REST API)
From the project root:
```powershell
cd backend

# 1. Install or update dependencies (if needed)
& "D:\Office\Scripts\.venv\Scripts\python.exe" -m pip install -r requirements.txt

# 2. Run database migrations
& "D:\Office\Scripts\.venv\Scripts\python.exe" manage.py migrate

# 3. Run automated tests (19 tests)
& "D:\Office\Scripts\.venv\Scripts\python.exe" manage.py test

# 4. Start the Django development server
& "D:\Office\Scripts\.venv\Scripts\python.exe" manage.py runserver 8000
```
Backend API will be live at `http://127.0.0.1:8000/`.

---

### 3. Run the Frontend (Next.js 15 PWA)
In a second PowerShell terminal:
```powershell
cd frontend-next

# 1. Install dependencies (if needed)
npm install

# 2. Start the Next.js development server
npm run dev
```
Frontend web application will be live at `http://localhost:3000/`.

---

## 📏 Codebase Quality Rules
- **Strict File Limit**: Every single file is strictly **≤ 300–350 lines** for optimal human readability and modularity.
- **Line Count Audit**: Run `node check-line-counts.js` anytime to verify all files obey the line limit.
