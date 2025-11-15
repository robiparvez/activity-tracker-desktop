import fs from 'fs/promises'
import path from 'path'

export interface Config {
    decryptionKey: string
    employeeId: string
    dbPath?: string
}

const CONFIG_PATH = path.join(process.cwd(), 'app-config.json')

const DEFAULT_CONFIG: Config = {
    decryptionKey: '',
    employeeId: '',
}

export async function getConfig(): Promise<Config> {
    try {
        const content = await fs.readFile(CONFIG_PATH, 'utf-8')
        return { ...DEFAULT_CONFIG, ...JSON.parse(content) }
    } catch {
        // Config file doesn't exist, create it with defaults
        await fs.writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2))
        return DEFAULT_CONFIG
    }
}

export async function setConfig(newConfig: Partial<Config>): Promise<void> {
    const currentConfig = await getConfig()
    const updatedConfig = { ...currentConfig, ...newConfig }
    await fs.writeFile(CONFIG_PATH, JSON.stringify(updatedConfig, null, 2))
}
