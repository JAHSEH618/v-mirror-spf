#!/usr/bin/env node
/**
 * SQLite to PostgreSQL Data Migration Script
 * 
 * Handles type conversions:
 * - SQLite integer timestamps → JavaScript Date objects
 * - SQLite 0/1 integers → JavaScript booleans
 */

import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// SQLite database path
const SQLITE_PATH = join(__dirname, '../prisma/dev.sqlite');

// List of boolean fields in our schema
const BOOLEAN_FIELDS = [
    'isOnline', 'accountOwner', 'collaborator', 'processed', 'success', 'isActive', 'isCurrent'
];

// List of DateTime fields that might be stored as timestamps
const DATETIME_FIELDS = [
    'createdAt', 'updatedAt', 'completedAt', 'lastTryOn', 'expires', 'date'
];

function convertValue(key, value) {
    if (value === null || value === undefined) {
        return null;
    }

    // Handle boolean fields (SQLite stores as 0/1)
    if (BOOLEAN_FIELDS.includes(key)) {
        return Boolean(value);
    }

    // Handle DateTime fields (SQLite might store as timestamp or ISO string)
    if (DATETIME_FIELDS.includes(key) || key.endsWith('At') || key.endsWith('Date')) {
        if (typeof value === 'number') {
            // Unix timestamp in milliseconds
            return new Date(value);
        } else if (typeof value === 'string') {
            return new Date(value);
        }
    }

    return value;
}

async function migrate() {
    console.log('🚀 Starting SQLite → PostgreSQL data migration...\n');

    // Connect to SQLite
    const sqlite = new Database(SQLITE_PATH, { readonly: true });

    // Connect to PostgreSQL via Prisma
    const prisma = new PrismaClient();

    try {
        // Get all tables from SQLite
        const tables = sqlite.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'
        `).all();

        console.log(`📋 Found ${tables.length} tables to migrate:`);
        tables.forEach(t => console.log(`   - ${t.name}`));

        for (const { name: tableName } of tables) {
            console.log(`\n📦 Migrating table: ${tableName}`);

            // Get all rows from SQLite table
            const rows = sqlite.prepare(`SELECT * FROM "${tableName}"`).all();
            console.log(`   Found ${rows.length} rows`);

            if (rows.length === 0) {
                console.log(`   ⏭ Skipping (empty table)`);
                continue;
            }

            // Map table name to Prisma model name
            let modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
            let model = prisma[modelName];

            if (!model) {
                console.log(`   ⚠️ No Prisma model found for ${tableName}, skipping...`);
                continue;
            }

            // Insert data
            let inserted = 0;
            let skipped = 0;
            let errors = 0;

            for (const row of rows) {
                try {
                    // Convert all values with proper type handling
                    const cleanRow = {};
                    for (const [key, value] of Object.entries(row)) {
                        cleanRow[key] = convertValue(key, value);
                    }

                    // Use upsert to handle existing records
                    await model.upsert({
                        where: { id: row.id },
                        update: {},  // Don't update if exists
                        create: cleanRow
                    });
                    inserted++;
                } catch (error) {
                    if (error.code === 'P2002') {
                        skipped++;
                    } else {
                        errors++;
                        if (errors <= 2) {
                            console.error(`   ❌ Error:`, error.message.split('\n')[0]);
                        }
                    }
                }
            }

            console.log(`   ✅ Inserted: ${inserted}, Skipped: ${skipped}, Errors: ${errors}`);
        }

        console.log('\n\n✅ Migration complete!');

        // Verify counts
        console.log('\n📊 Verification:');
        const sessionCount = await prisma.session.count();
        const billingCount = await prisma.billingInfo.count();
        const tryOnCount = await prisma.tryOnEvent.count();
        const productStatCount = await prisma.productStat.count();
        console.log(`   Sessions: ${sessionCount}`);
        console.log(`   BillingInfo: ${billingCount}`);
        console.log(`   TryOnEvents: ${tryOnCount}`);
        console.log(`   ProductStats: ${productStatCount}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        sqlite.close();
        await prisma.$disconnect();
    }
}

migrate();
