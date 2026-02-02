#!/usr/bin/env node
/**
 * D3-2 FIX: Cleanup old WebhookEvent records
 * 
 * Run periodically (e.g., daily cron) to prevent table bloat:
 * node scripts/cleanup-webhooks.js
 * 
 * Or add to package.json scripts:
 * "cleanup:webhooks": "node scripts/cleanup-webhooks.js"
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Keep webhook records for 7 days (sufficient for debugging)
const RETENTION_DAYS = 7;

async function cleanupWebhookEvents() {
    const cutoffDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    console.log(`[Cleanup] Deleting WebhookEvent records older than ${cutoffDate.toISOString()}`);

    try {
        const result = await prisma.webhookEvent.deleteMany({
            where: {
                createdAt: { lt: cutoffDate }
            }
        });

        console.log(`[Cleanup] ✅ Deleted ${result.count} old webhook records`);

        // Also clean up old upload tasks (completed > 30 days)
        const uploadCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const uploadResult = await prisma.uploadTask.deleteMany({
            where: {
                status: 'completed',
                completedAt: { lt: uploadCutoff }
            }
        });

        console.log(`[Cleanup] ✅ Deleted ${uploadResult.count} old upload task records`);

    } catch (error) {
        console.error('[Cleanup] ❌ Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupWebhookEvents();
