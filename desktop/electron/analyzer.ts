import { readActivityData } from './db-reader'
import { Config } from './config'
import * as crypto from 'crypto'

interface DailyAnalysis {
    date: string
    totalHours: number
    activeHours: number
    inactiveHours: number
    afkHours: number
    activityRate: number
    startTime: string
    endTime: string
    productivity: 'excellent' | 'good' | 'needs-improvement'
    productivityEmoji: string
}

interface MultiDayAnalysis {
    totalDays: number
    totalActiveHours: number
    totalTrackedHours: number
    totalInactiveHours: number
    averageActiveHours: number
    averageTotalHours: number
    averageInactiveHours: number
    overallActivityRate: number
    dailyBreakdown: Array<{
        date: string
        activeHours: number
        inactiveHours: number
        totalHours: number
        activityRate: number
    }>
}

function decryptValue(encryptedValue: string, key: string): string {
    try {
        // The encrypted data in the database is: base64(base64(fernet_token))
        // Double base64 encoded! First decode to get the base64 fernet token string
        const fernetTokenBase64 = Buffer.from(encryptedValue, 'base64').toString('utf-8')
        // Second decode to get the raw Fernet token bytes
        const fernetToken = Buffer.from(fernetTokenBase64, 'base64')

        // Step 2: Base64 decode the key (Fernet uses URL-safe base64 for keys)
        const keyBuffer = Buffer.from(key, 'base64')

        // Step 3: Extract components from the Fernet token
        const version = fernetToken.readUInt8(0)
        if (version !== 0x80) {
            throw new Error(`Invalid Fernet version: ${version}`)
        }

        // Fernet uses first 16 bytes of key for signing (HMAC), last 16 bytes for encryption (AES)
        const signingKey = keyBuffer.slice(0, 16)
        const encryptionKey = keyBuffer.slice(16, 32)

        // Verify HMAC (last 32 bytes of token)
        const hmacStart = fernetToken.length - 32
        const dataToVerify = fernetToken.slice(0, hmacStart)
        const providedHmac = fernetToken.slice(hmacStart)

        const hmac = crypto.createHmac('sha256', signingKey)
        hmac.update(dataToVerify)
        const computedHmac = hmac.digest()

        if (!crypto.timingSafeEqual(providedHmac, computedHmac)) {
            throw new Error('HMAC verification failed')
        }

        // Extract IV and ciphertext
        const iv = fernetToken.slice(9, 25) // bytes 9-24 (16 bytes)
        const ciphertext = fernetToken.slice(25, hmacStart)

        // Decrypt using AES-128-CBC
        const decipher = crypto.createDecipheriv('aes-128-cbc', encryptionKey, iv)
        let decrypted = decipher.update(ciphertext)
        decrypted = Buffer.concat([decrypted, decipher.final()])

        return decrypted.toString('utf-8')
    } catch (error) {
        throw new Error(`Decryption failed: ${(error as Error).message}`)
    }
}

function parseTime(timestamp: number): string {
    // Convert timestamp (seconds since epoch) to Date object
    const date = new Date(timestamp * 1000)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

function calculateProductivity(activityRate: number, totalHours: number): {
    level: 'excellent' | 'good' | 'needs-improvement'
    emoji: string
} {
    if (activityRate >= 80 && totalHours >= 6) {
        return { level: 'excellent', emoji: '🟢' }
    } else if (activityRate >= 60 && totalHours >= 4) {
        return { level: 'good', emoji: '🟡' }
    } else {
        return { level: 'needs-improvement', emoji: '🔴' }
    }
}

export async function getAvailableDates(config: Config): Promise<string[]> {
    try {
        const data = await readActivityData()

        const dates = new Set<string>()

        for (const record of data) {
            if (record.employee_id === config.employeeId && record.start_time) {
                // Extract date from start_time (format: YYYY-MM-DDTHH:MM:SS)
                const dateStr = record.start_time.split('T')[0]
                dates.add(dateStr)
            }
        }

        return Array.from(dates).sort()
    } catch (error) {
        return []
    }
}

export async function analyzeSingleDate(
    date: string,
    config: Config
): Promise<DailyAnalysis> {
    console.log('[Analyzer] analyzeSingleDate called:', { date, employeeId: config.employeeId })

    const data = await readActivityData()
    console.log('[Analyzer] Total records loaded:', data.length)

    const dayRecords = data.filter((r: any) => {
        if (r.employee_id !== config.employeeId || !r.start_time) return false
        const recordDate = r.start_time.split('T')[0]
        return recordDate === date
    })

    console.log('[Analyzer] Filtered records for date:', {
        date,
        employeeId: config.employeeId,
        matchingRecords: dayRecords.length,
        sampleRecord: dayRecords[0]
    })

    if (dayRecords.length === 0) {
        console.warn('[Analyzer] No data found for date:', date)
        throw new Error(`No data found for date: ${date}`)
    }

    let totalSeconds = 0
    let activeSeconds = 0
    let afkSeconds = 0
    let minTime = Infinity
    let maxTime = 0

    for (const record of dayRecords) {
        // Decrypt duration
        const durationStr = config.decryptionKey
            ? decryptValue(record.duration_seconds, config.decryptionKey)
            : record.duration_seconds

        const duration = parseFloat(durationStr)
        totalSeconds += duration

        // Decrypt AFK status
        const afkStr = config.decryptionKey
            ? decryptValue(record.is_afk, config.decryptionKey)
            : record.is_afk

        const isAfk = afkStr === '1' || afkStr === 'true' || afkStr === 'True'

        if (isAfk) {
            afkSeconds += duration
        } else {
            activeSeconds += duration
        }

        // Track time range - calculate end time from start + duration
        if (record.start_time) {
            const startTimestamp = new Date(record.start_time).getTime()
            const endTimestamp = startTimestamp + (duration * 1000)
            minTime = Math.min(minTime, startTimestamp)
            maxTime = Math.max(maxTime, endTimestamp)
        }
    }

    const totalHours = totalSeconds / 3600
    const activeHours = activeSeconds / 3600
    const afkHours = afkSeconds / 3600
    const inactiveHours = totalHours - activeHours
    const activityRate = (activeHours / totalHours) * 100

    const productivity = calculateProductivity(activityRate, totalHours)

    const result = {
        date,
        totalHours: Math.round(totalHours * 100) / 100,
        activeHours: Math.round(activeHours * 100) / 100,
        inactiveHours: Math.round(inactiveHours * 100) / 100,
        afkHours: Math.round(afkHours * 100) / 100,
        activityRate: Math.round(activityRate * 10) / 10,
        startTime: minTime !== Infinity ? parseTime(minTime / 1000) : 'N/A',
        endTime: maxTime !== 0 ? parseTime(maxTime / 1000) : 'N/A',
        productivity: productivity.level,
        productivityEmoji: productivity.emoji,
    }

    console.log('[Analyzer] Analysis result:', result)
    return result
}

export async function analyzeMultiDate(
    dates: string[],
    config: Config
): Promise<MultiDayAnalysis> {
    const dailyAnalyses = await Promise.all(
        dates.map((date) => analyzeSingleDate(date, config))
    )

    let totalActiveHours = 0
    let totalTrackedHours = 0
    let totalInactiveHours = 0

    const dailyBreakdown = dailyAnalyses.map((analysis) => {
        totalActiveHours += analysis.activeHours
        totalTrackedHours += analysis.totalHours
        totalInactiveHours += analysis.inactiveHours

        return {
            date: analysis.date,
            activeHours: analysis.activeHours,
            inactiveHours: analysis.inactiveHours,
            totalHours: analysis.totalHours,
            activityRate: analysis.activityRate,
        }
    })

    const totalDays = dates.length
    const averageActiveHours = totalActiveHours / totalDays
    const averageTotalHours = totalTrackedHours / totalDays
    const averageInactiveHours = totalInactiveHours / totalDays
    const overallActivityRate = (totalActiveHours / totalTrackedHours) * 100

    return {
        totalDays,
        totalActiveHours: Math.round(totalActiveHours * 100) / 100,
        totalTrackedHours: Math.round(totalTrackedHours * 100) / 100,
        totalInactiveHours: Math.round(totalInactiveHours * 100) / 100,
        averageActiveHours: Math.round(averageActiveHours * 100) / 100,
        averageTotalHours: Math.round(averageTotalHours * 100) / 100,
        averageInactiveHours: Math.round(averageInactiveHours * 100) / 100,
        overallActivityRate: Math.round(overallActivityRate * 10) / 10,
        dailyBreakdown,
    }
}
