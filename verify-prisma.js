import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking Prisma Client for ProductStat model...");
    if (prisma.productStat) {
        console.log("SUCCESS: prisma.productStat exists.");
        // Try a simple count or findFirst to be sure
        try {
            const count = await prisma.productStat.count();
            console.log(`Current ProductStat count: ${count}`);
        } catch (e) {
            console.error("Model exists but query failed:", e);
        }
    } else {
        console.error("FAILURE: prisma.productStat is UNDEFINED.");
        console.log("Available models:", Object.keys(prisma).filter(k => !k.startsWith('_')));
    }
}

main()
    .catch(e => {
        console.error("Script error:", e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
