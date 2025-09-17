import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.resolve(process.cwd(), 'data', 'evaluations.json')

function ensureDataFile() {
    const dir = path.dirname(DATA_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([]))
}

export async function GET(request: NextRequest) {
    try {
        ensureDataFile()
        const raw = fs.readFileSync(DATA_FILE, 'utf-8')
        const items = JSON.parse(raw)
        return NextResponse.json(items)
    } catch (error) {
        console.error('Error reading evaluations:', error)
        return NextResponse.json({ error: 'Error reading evaluations' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        ensureDataFile()
        const body = await request.json()
        const raw = fs.readFileSync(DATA_FILE, 'utf-8')
        const items = JSON.parse(raw)
        const id = Date.now().toString()
        const newItem = { ...body, id }
        items.unshift(newItem)
        fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2))
        return NextResponse.json(newItem, { status: 201 })
    } catch (error) {
        console.error('Error creating evaluation:', error)
        return NextResponse.json({ error: 'Error creating evaluation' }, { status: 500 })
    }
}
