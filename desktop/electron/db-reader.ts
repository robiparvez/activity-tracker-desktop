import path from 'path'
import fs from 'fs/promises'
import os from 'os'
import { app } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const DB_PATH = path.join(
    os.homedir(),
    'AppData',
    'Roaming',
    'ActivityTracker',
    'local_activity.db'
)

const JSON_OUTPUT_PATH = path.join(process.cwd(), 'activity.json')

export async function discoverDatabase(): Promise<string> {
    try {
        await fs.access(DB_PATH)
        return DB_PATH
    } catch {
        throw new Error(
            `ActivityTracker database not found at: ${DB_PATH}\n\n` +
            'Please ensure ActivityTracker is installed and has generated data.'
        )
    }
}

export async function exportToJson(): Promise<string> {
    try {
        const dbPath = await discoverDatabase()

        // Use Python script to export database (avoids sql.js WASM issues in Electron)
        const appPath = app.getAppPath()
        const pythonScript = path.join(appPath, '..', 'export_db.py')

        console.log('Exporting database using Python script...')

        // Create a simple Python script to export SQLite to JSON
        const scriptContent = `
import sqlite3
import json
import sys
import base64
from datetime import datetime, timedelta

db_path = r"${dbPath.replace(/\\/g, '\\\\')}"
output_path = r"${JSON_OUTPUT_PATH.replace(/\\/g, '\\\\')}"

def serialize_value(value):
    """Convert bytes to base64 string for JSON serialization"""
    if isinstance(value, bytes):
        return base64.b64encode(value).decode('utf-8')
    return value

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Calculate date 7 days ago for manageable dataset
    seven_days_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()

    data = {}
    for (table_name,) in tables:
        if table_name == 'sqlite_sequence':
            continue
        # Only export records from last 90 days if table has start_time column
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns_info = cursor.fetchall()
        has_start_time = any(col[1] == 'start_time' for col in columns_info)

        if has_start_time:
            query = f"SELECT * FROM {table_name} WHERE start_time >= '{seven_days_ago}'"
        else:
            query = f"SELECT * FROM {table_name}"

        cursor.execute(query)
        columns = [description[0] for description in cursor.description]
        rows = cursor.fetchall()
        # Convert bytes to base64 for JSON serialization
        data[table_name] = [dict(zip(columns, [serialize_value(v) for v in row])) for row in rows]

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, default=str)

    conn.close()
    print(f"Success: {output_path}")
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
`
        await fs.writeFile(pythonScript, scriptContent, 'utf-8')

        // Execute Python script
        const { stdout, stderr } = await execAsync(`python "${pythonScript}"`)

        if (stderr && !stderr.includes('Success')) {
            throw new Error(stderr)
        }

        console.log('Database export completed:', stdout)

        // Clean up temp script
        await fs.unlink(pythonScript).catch(() => {})

        return JSON_OUTPUT_PATH
    } catch (error) {
        console.error('Database export failed:', error)
        throw new Error(`Failed to export database: ${(error as Error).message}`)
    }
}

export async function readActivityData(): Promise<any[]> {
    try {
        const content = await fs.readFile(JSON_OUTPUT_PATH, 'utf-8')
        const data = JSON.parse(content)

        // Assuming the main table is 'activities' or similar
        // Adjust based on actual table name in ActivityTracker DB
        return data.activities || data.activity || Object.values(data)[0] || []
    } catch (error) {
        throw new Error('Failed to read activity data. Please export the database first.')
    }
}
