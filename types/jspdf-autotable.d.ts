declare module 'jspdf-autotable' {
    interface AutoTableOptions {
        head?: any[][]
        body?: any[][]
        startY?: number
        margin?: {
            top?: number
            left?: number
            right?: number
            bottom?: number
        }
        headStyles?: {
            fillColor?: number[]
            textColor?: number[]
            fontStyle?: string
            halign?: string
        }
        bodyStyles?: {
            textColor?: number[]
            halign?: string
        }
        alternateRowStyles?: {
            fillColor?: number[]
        }
        columnStyles?: {
            [key: number]: {
                cellWidth?: number
                halign?: string
            }
        }
        styles?: {
            fontSize?: number
            cellPadding?: number
        }
    }

    interface jsPDFWithAutoTable {
        autoTable(options: AutoTableOptions): void
        lastAutoTable: {
            finalY: number
        }
    }
}
