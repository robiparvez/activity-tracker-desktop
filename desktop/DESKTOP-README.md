# Activity Tracker Desktop Application

A modern desktop application built with Electron + React for analyzing work hours and productivity metrics from ActivityTracker data.

## ✨ Features

- **🔍 Automatic Database Discovery** - Automatically locates ActivityTracker database
- **📊 Comprehensive Analytics** - Daily and multi-day productivity analysis
- **🔐 Secure Decryption** - Fernet encryption support for sensitive data
- **📈 Beautiful Charts** - Interactive visualizations using Recharts
- **⚙️ Easy Configuration** - Simple settings panel for customization
- **🎨 Modern UI** - Built with React, TailwindCSS, and shadcn/ui components

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- ActivityTracker installed and generating data

### Installation

1. **Install dependencies:**

```bash
npm install
```

1. **Configure the application:**

First time setup requires:

- Your Fernet decryption key (from your ActivityTracker config)
- Your host name

These can be configured through the Settings tab in the app.

1. **Run in development mode:**

```bash
npm run electron:dev
```

1. **Build for production:**

```bash
npm run electron:build
```

The installer will be created in the `release/` directory.

## 📖 Usage

### First Launch

1. **Settings Configuration**
   - Navigate to the Settings tab
   - Enter your decryption key from ActivityTracker
   - Enter your host name
   - Click "Save Configuration"

2. **Refresh Data**
   - The app automatically discovers and exports your ActivityTracker database
   - Click "Refresh Data from Database" to manually update

3. **View Analytics**
   - **Dashboard Tab**: View detailed single-day analysis
     - Select any date to see comprehensive metrics
     - View activity rate, hours breakdown, and productivity assessment
   - **Summary Tab**: View multi-day trends
     - See overall statistics across all dates
     - View charts showing activity trends
     - Review daily breakdown table

### Key Metrics

- **Total Hours**: Complete tracked time for the day
- **Active Hours**: Time spent actively working
- **Inactive Hours**: Tracked but not actively working
- **AFK Hours**: Away from keyboard time
- **Activity Rate**: Percentage of active vs total time

### Productivity Assessment

- 🟢 **Excellent**: 80%+ activity rate with 6+ hours
- 🟡 **Good**: 60%+ activity rate with 4+ hours
- 🔴 **Needs Improvement**: Below good thresholds

## 🛠️ Development

### Project Structure

```text
activity-tracker-desktop/
├── electron/              # Electron main process
│   ├── main.ts           # App initialization & IPC
│   ├── preload.ts        # Context bridge
│   ├── db-reader.ts      # SQLite database handler
│   ├── analyzer.ts       # Analysis logic
│   └── config.ts         # Configuration management
├── src/                   # React frontend
│   ├── components/       # React components
│   │   ├── Dashboard.tsx
│   │   ├── Summary.tsx
│   │   ├── Settings.tsx
│   │   └── ui/          # shadcn/ui components
│   ├── lib/             # Utilities
│   ├── types/           # TypeScript types
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # React entry point
│   └── index.css        # Global styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

### Available Scripts

- `npm run dev` - Start Vite dev server
- `npm run electron:dev` - Run Electron in development mode
- `npm run build` - Build for production
- `npm run electron:build` - Build and package for distribution
- `npm run preview` - Preview production build

### Tech Stack

**Frontend:**

- React 18
- TypeScript
- TailwindCSS
- shadcn/ui components
- Recharts
- Lucide icons
- Framer Motion

**Backend:**

- Electron
- Node.js
- better-sqlite3
- Fernet encryption

**Build Tools:**

- Vite
- electron-builder

## 🔧 Configuration

### App Configuration (`app-config.json`)

```json
{
  "decryptionKey": "your-fernet-key-here",
  "employeeId": "your-employee-id"
}
```

### Database Location

The app automatically looks for ActivityTracker database at:

```text
%USERPROFILE%\AppData\Roaming\ActivityTracker\local_activity.db
```

## 📦 Building for Distribution

To create a Windows installer:

```bash
npm run electron:build
```

The installer will be created in `release/` directory with:

- NSIS installer (.exe)
- Unpacked application files

## 🔒 Security

- Decryption keys are stored locally in `app-config.json`
- No data is sent to external servers
- All processing happens locally on your machine

## 🐛 Troubleshooting

### Database Not Found

- Ensure ActivityTracker is installed
- Verify ActivityTracker has generated data
- Check that the database exists at the expected location

### Decryption Errors

- Verify your decryption key is correct
- Ensure the key matches your ActivityTracker configuration

### No Data Displayed

- Check that your Hostname is correct
- Verify data exists for the selected dates
- Try refreshing the data from Settings

## 📝 Migration from Python Script

This desktop app replaces the need for:

- Manual DB Browser for SQLite usage
- Running `python analysis.py` from command line
- Manual JSON exports

Everything is now automated with a beautiful UI!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Built with modern web technologies
- Uses ActivityTracker data format
- Inspired by the need for better productivity analytics

---

## Made with ❤️ for better productivity tracking
