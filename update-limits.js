import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting update of Free Plan limits...");

    // Update 'Free Plan'
    const result1 = await prisma.billingInfo.updateMany({
        where: {
            planName: "Free Plan"
        },
        data: {
            usageLimit: 2
        }
    });
    console.log(`Updated ${result1.count} records with planName 'Free Plan'.`);

    // Update 'Free Trial' (initial state without payment)
    const result2 = await prisma.billingInfo.updateMany({
        where: {
            planName: "Free Trial"
        },
        data: {
            usageLimit: 2
        }
    });
    console.log(`Updated ${result2.count} records with planName 'Free Trial'.`);

    console.log("Update complete.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
