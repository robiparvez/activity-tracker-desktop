# **FULL DEVELOPMENT INSTRUCTION SET FOR BUILDING THE ACTIVITY TRACKER ANALYSIS DESKTOP APP (REACT + ELECTRON)**

This single, consolidated instruction document is designed so that **GitHub Copilot / Claude Sonnet 4.5** can generate a **fully-functional, production-grade desktop application in one go** — including automation of SQLite extraction, JSON exporting, data decryption, and analytics rendering using a modern UI/UX.

---

# ✅ **PROJECT GOAL**

Build a **cross-platform (Windows-focused)** desktop application using:

- **Electron** (app shell + OS-level automation)
- **React + Vite** (UI)
- **TailwindCSS / shadcn/ui** (modern UI/UX)
- **Node backend (inside Electron)** for:
  - Reading ActivityTracker SQLite DB
  - Auto-exporting JSON from SQLite
  - Running the entire analysis logic normally done via `analysis.py`
  - Producing visual analytics dashboards

The app must **automate the 3 manual steps** currently done by the user:

1. Locate ActivityTracker DB file
2. Open SQLite DB
3. Export tables to JSON

The app should also:

- Load & decrypt ActivityTracker data (Fernet key via config)
- Provide detailed daily/multi-day productivity analytics
- Render charts & summaries with a modern dashboard UI
- Allow the user to browse dates, employees, metrics
- Allow configuration editing (decryption key, employee ID, output settings)

---

# 🎯 **CORE FEATURES TO IMPLEMENT**

## 1. **Automatic DB Discovery**

The app must automatically detect:

%USERPROFILE%\AppData\Roaming\ActivityTracker\local_activity.db

If missing, show a modern UI warning and instructions.

## 2. **Automated JSON Export (No DB Browser Needed)**

Instead of the manual steps:

- Opening DB Browser
- Exporting table(s) to JSON

The app must:

- Use a Node SQLite library (e.g., `better-sqlite3` or `sqlite3`)
- Read all tables directly
- Export them as `activity.json` internally
- Store in the app’s own workspace directory

## 3. **Decryption Logic (Replace Python with Node Implementation)**

Reimplement the Fernet decryption logic:

- Use `fernet` npm package or a compatible library
- Accept the **DECRYPTION_KEY** from a config modal
- Decrypt:
  - duration
  - afk flag/fields

## 4. **Full Analysis Engine (Node Implementation of analysis.py)**

Must produce identical metrics:

### **Per-Day Analysis**

- Total hours
- Active time
- Inactive time
- AFK hours
- Activity rate %
- Start & end timestamps (AM/PM formatted)
- Productivity assessment:
  - 🟢 Excellent
  - 🟡 Good
  - 🔴 Needs Improvement

### **Multi-Day Summary**

- Total days
- Total active hours
- Average active hours/day
- Overall activity rate
- Per-day breakdown list

## 5. **Modern UI/UX Requirements**

Use:

- **React + Vite**
- **TailwindCSS**
- **shadcn/ui components**
- **Lucide icons**
- **Framer Motion animations**

### Pages

1. **Dashboard**
   - Active hours, inactive hours, AFK hours
   - Activity rate gauge
   - Daily timeline visualization
   - Summary cards

2. **Date Browser**
   - Calendar to pick days
   - List of sessions
   - Work intervals timeline chart

3. **Multi-Day Summary**
   - Charts (bar, line, pie)
   - Trend analysis

4. **Configuration Panel**
   - Enter decryption key
   - Select employee ID
   - View discovered DB path
   - Regenerate JSON
   - Toggle settings

## 6. **Charts**

Use:

- `recharts` or `visx`
- No D3 unless needed
- Light & dark mode supported

Charts include:

- Daily activity timeline
- Activity rate bar chart
- AFK timeline
- Multi-day trend line

## 7. **File System Integration**

Electron backend must:

- Auto-read SQLite DB
- Auto-export JSON
- Cache processed analytics
- Watch for changes in DB and re-run analysis automatically

## 8. **Packaging**

Use:

- `electron-builder` for Windows installer (NSIS)
- App auto-update support

---

# 🔧 **FULL SYSTEM REQUIREMENTS**

## **Tech Stack**

### Frontend

- React
- Vite
- TailwindCSS
- shadcn/ui
- Lucide-react icons
- Recharts
- Framer Motion

### Backend (within Electron)

- Node.js
- better-sqlite3
- fernet
- fs/promises

### App Shell

- Electron 30+
- electron-builder packaging

---

# 📁 **PROJECT FILE STRUCTURE TO FOLLOW**

root/
│ package.json
│ electron.vite.config.js
│
├─ electron/
│ ├─ main.ts # Electron main process
│ ├─ db-reader.ts # SQLite reader + JSON exporter
│ ├─ analyzer.ts # Full logic (analysis.py port)
│ ├─ config.ts # Reads config.json
│ └─ ipc.ts # All IPC endpoints
│
├─ src/
│ ├─ app/
│ │ ├─ Dashboard.tsx
│ │ ├─ DailyAnalysis.tsx
│ │ ├─ Summary.tsx
│ │ └─ Settings.tsx
│ ├─ components/
│ ├─ hooks/
│ └─ utils/
│
└─ config.json

---

# ⚙️ **IPC Endpoints Needed**

1. `db:discover`
2. `db:export-json`
3. `analysis:run-single-date`
4. `analysis:run-multi-date`
5. `config:get`
6. `config:set`

---

# 🧠 **BEHAVIOR FLOW**

### At app startup

1. Discover DB
2. If found:
   - Auto-export JSON
   - Run analysis
3. Render dashboard with freshest data

### On user-triggered actions

- Regenerate JSON
- Change config
- Switch days
- Export reports (PDF/CSV optional)

---

# 📦 **DELIVERABLES FROM COPILOT / CLAUDE**

Your generated output must include:

1. **Electron + React project setup code**
2. **SQLite auto-export implementation**
3. **Fernet decryption implementation**
4. **Complete analysis engine**
5. **React UI with pages & components**
6. **Charts**
7. **Tailwind + shadcn UI**
8. **IPC wiring**
9. **Build packaging scripts**

Everything must be generated **error-free**, in a **single-pass**, as a **complete working application**.

---

# 🏁 **FINAL REQUEST FOR GENERATION**

> **Using the entire specification above, generate the full project codebase into a desktop folder (Electron + React + Tailwind + shadcn + SQLite automation + Node analysis engine) in one pass, error-free, following the exact architecture and features described.**

This markdown is the **exact prompt** to feed into GitHub Copilot or Claude Sonnet 4.5 for auto-generating the full desktop application.

```markdown
