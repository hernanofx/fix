#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function getTableStats() {
    const prisma = new PrismaClient();

    try {
        const result = await prisma.$queryRaw`
            SELECT schemaname, tablename 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            LIMIT 5
        `;
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Query failed:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

getTableStats();