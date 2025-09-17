import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.resolve(process.cwd(), 'data', 'evaluations.json')

function ensureDataFile() {
    const dir = path.dirname(DATA_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([]))
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        ensureDataFile()
        const raw = fs.readFileSync(DATA_FILE, 'utf-8')
        const items = JSON.parse(raw)
        const found = items.find((i: any) => i.id === params.id)
        if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json(found)
    } catch (error) {
        console.error('Error reading evaluation:', error)
        return NextResponse.json({ error: 'Error reading evaluation' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        ensureDataFile()
        const body = await request.json()
        const raw = fs.readFileSync(DATA_FILE, 'utf-8')
        const items = JSON.parse(raw)
        const idx = items.findIndex((i: any) => i.id === params.id)
        if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        items[idx] = { ...items[idx], ...body }
        fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2))
        return NextResponse.json(items[idx])
    } catch (error) {
        console.error('Error updating evaluation:', error)
        return NextResponse.json({ error: 'Error updating evaluation' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        ensureDataFile()
        const raw = fs.readFileSync(DATA_FILE, 'utf-8')
        let items = JSON.parse(raw)
        const exists = items.find((i: any) => i.id === params.id)
        if (!exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        items = items.filter((i: any) => i.id !== params.id)
        fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2))
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting evaluation:', error)
        return NextResponse.json({ error: 'Error deleting evaluation' }, { status: 500 })
    }
}
