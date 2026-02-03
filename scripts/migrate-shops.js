
import prisma from "../app/db.server.js";

async function main() {
    console.log("Starting Shop migration...");

    // 1. Collect all unique shops
    const shops = new Set();

    const sessions = await prisma.session.findMany({ select: { shop: true } });
    sessions.forEach(s => shops.add(s.shop));

    const billings = await prisma.billingInfo.findMany({ select: { shop: true } });
    billings.forEach(b => shops.add(b.shop));

    const settings = await prisma.widgetSettings.findMany({ select: { shop: true } });
    settings.forEach(s => shops.add(s.shop));

    const events = await prisma.tryOnEvent.findMany({
        select: { shop: true },
        distinct: ['shop']
    });
    events.forEach(e => shops.add(e.shop));

    console.log(`Found ${shops.size} unique shops.`);

    // 2. Create Shop records
    for (const shopDomain of shops) {
        if (!shopDomain) continue;

        await prisma.shop.upsert({
            where: { id: shopDomain },
            update: {},
            create: { id: shopDomain }
        });
        console.log(`Checked/Created Shop: ${shopDomain}`);
    }

    // 3. Migrate BillingInfo to ShopSubscription
    console.log("Migrating BillingInfo to ShopSubscription...");
    const oldBillings = await prisma.billingInfo.findMany();

    for (const bill of oldBillings) {
        await prisma.shopSubscription.upsert({
            where: { shopId: bill.shop },
            update: {
                planName: bill.planName,
                status: bill.status,
                usageLimit: bill.usageLimit,
                currentUsage: bill.currentUsage,
                cycleStartDate: bill.cycleStartDate,
                paymentMethod: bill.paymentType,
            },
            create: {
                shopId: bill.shop,
                planName: bill.planName,
                status: bill.status,
                usageLimit: bill.usageLimit,
                currentUsage: bill.currentUsage,
                cycleStartDate: bill.cycleStartDate,
                paymentMethod: bill.paymentType,
            }
        });
        console.log(`Migrated subscription for ${bill.shop}`);
    }

    console.log("Migration complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
