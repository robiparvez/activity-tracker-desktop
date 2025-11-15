declare module 'sql.js' {
    export interface SqlJsConfig {
        locateFile?: (filename: string) => string
        wasmBinary?: ArrayBuffer | Uint8Array
    }

    export interface Database {
        exec(sql: string): QueryExecResult[]
        close(): void
    }

    export interface QueryExecResult {
        columns: string[]
        values: any[][]
    }

    export interface SqlJsStatic {
        Database: new (data?: ArrayBuffer | Uint8Array) => Database
    }

    export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>
}
