# Activity Tracker Analysis Tool

A comprehensive analysis solution for work hours and productivity metrics from ActivityTracker data.

## 🚀 **NEW: Desktop Application Available!**

We now have a **modern desktop application** built with Electron + React that automates the entire process!

**Desktop App Features:**

- ✨ **No Manual Steps** - Automatically discovers and reads ActivityTracker database
- 📊 **Beautiful Dashboard** - Modern UI with interactive charts and analytics
- ⚡ **Fast & Easy** - No DB Browser needed, no manual exports
- 🎨 **Modern Design** - Built with TailwindCSS and shadcn/ui components
- 📈 **Real-time Updates** - Refresh data with a single click

### Quick Start Desktop App

**Prerequisites:** Node.js 18+ required

```bash
# Navigate to desktop app folder
cd desktop

# Install dependencies
npm install

# Run desktop app
npm run electron:dev

# Build for production
npm run electron:build
```

📘 **Full Documentation:** See [desktop/](./desktop/) folder for complete guides:

- [desktop/README.md](./desktop/README.md) - Quick start
- [desktop/INSTALLATION-GUIDE.md](./desktop/INSTALLATION-GUIDE.md) - Detailed setup
- [desktop/DESKTOP-README.md](./desktop/DESKTOP-README.md) - Full documentation
- [desktop/PROJECT-SUMMARY.md](./desktop/PROJECT-SUMMARY.md) - What was built

**Note:** If you have Node.js 14 or need to avoid Node.js update, continue using the Python CLI tool below.

---

## 📊 Python CLI Tool (Original)

## Setup Instructions

### 1. Download and Install DB Browser for SQLite

Download DB Browser for SQLite from [https://sqlitebrowser.org/dl/](https://sqlitebrowser.org/dl/), install it, and open "DB Browser for SQLite".

### 2. Locate ActivityTracker Database

Navigate to `%USERPROFILE%\AppData\Roaming\ActivityTracker` and open `local_activity.db` in DB Browser for SQLite.

### 3. Export Database to JSON

In DB Browser for SQLite:

- Go to **File** → **Export** → **Table(s) to JSON**
- Export the data as `activity.json` in your project directory

### 4. Install Dependencies

This project uses [UV](https://github.com/astral-sh/uv) for fast dependency management. Install dependencies using:

```bash
uv sync
uv pip install -r requirements.txt
```

### 5. Update config.py

See the instructions in config.template.py

### 6. Run the Analysis

Execute the analysis script using UV:

```bash
uv run python analysis.py
```

## About the Script

The `analysis.py` script is a comprehensive work hours analysis tool that provides detailed productivity insights from ActivityTracker data. Here's what it does:

### Key Features

**Data Processing:**

- Loads encrypted activity data from `activity.json`
- Decrypts duration and AFK status using Fernet encryption
- Filters data by employee ID and date ranges

**Analysis Types:**

1. **Specific Date Analysis** - Detailed breakdown for a single day
2. **All Dates Summary** - Comprehensive overview across all available dates

**Metrics Calculated:**

- **Active Hours**: Time spent actively working
- **Inactive Hours**: Time tracked but not actively working
- **AFK Hours**: Away-from-keyboard time
- **Activity Rate**: Percentage of active time vs total time
- **Time Ranges**: Work start and end times in AM/PM format

**Productivity Analysis:**

- Color-coded assessments (🟢 Excellent, 🟡 Good, 🔴 Needs Improvement)
- Activity rate evaluation (80%+ excellent, 60%+ good, <60% low)
- Break time analysis (AFK patterns)
- Work schedule assessment (8h+ full day, 6h+ substantial, <6h limited)

**Output Examples:**

*Single Date Analysis:*

```text
📅 ENHANCED WORK HOURS ANALYSIS FOR Employee ON 2025-08-27
📊 Summary:
   Total Time: 6.16h
   Active Time: 3.15h
   Activity Rate: 51.2%
⏰ Time Range:
   Started: 12:16 PM
   Ended: 06:27 PM
```

*Multi-Date Summary:*

```text
📅 Analyzing 4 days of data:
   2025-08-27: 3.15h active (51.2%) & 2.15h inactive (39.2%) of 6.16h total
   2025-08-28: 4.22h active (68.5%) & 1.94h inactive (31.5%) of 6.16h total

📈 OVERALL SUMMARY:
   Total Days Analyzed: 4
   Total Active Hours: 12.64h
   Average Active Hours/Day: 3.16h
   Overall Activity Rate: 51.3%
```

### Configuration

The script requires a `config.py` file with:

- `DECRYPTION_KEY`: Fernet encryption key for data decryption
- `EMPLOYEE_ID`: Target employee identifier for filtering

This tool helps analyze work patterns, identify productivity trends, and optimize time management strategies.
