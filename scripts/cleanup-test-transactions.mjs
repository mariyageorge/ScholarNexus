import fs from "node:fs";
import { MongoClient } from "mongodb";

let uri = process.env.MONGODB_URI;
if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    if (line.startsWith("MONGODB_URI=")) {
      uri = line.replace("MONGODB_URI=", "").trim().replace(/^['"]|['"]$/g, "");
    }
  }
}

async function cleanupAndSync() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("scholarnexus");

  // 1. Remove mock test orders (order_test_...)
  const deleteResult = await db.collection("transactions").deleteMany({
    orderId: { $regex: "^order_test_" }
  });
  console.log(`Deleted ${deleteResult.deletedCount} test transactions with orderId matching 'order_test_*'`);

  // 2. Fetch remaining verified paid transactions
  const paidTxs = await db.collection("transactions").find({ status: "paid" }).toArray();
  console.log(`Remaining paid transactions in DB: ${paidTxs.length}`);
  for (const t of paidTxs) {
    console.log(`- Invoice: ${t.invoiceNumber || t.invoice?.invoiceNumber} | User: ${t.userEmail} | Amount: ₹${t.amountRupees || 499} | Payment: ${t.paymentId}`);
  }

  // 3. Sync isPremium flag for all users according to real paid transactions
  const paidEmails = new Set(paidTxs.map(t => t.userEmail?.trim().toLowerCase()).filter(Boolean));
  
  // Set isPremium = true for users with paid transactions
  for (const email of paidEmails) {
    const latestTx = paidTxs.filter(t => t.userEmail?.trim().toLowerCase() === email).sort((a,b) => new Date(b.verifiedAt || b.createdAt).getTime() - new Date(a.verifiedAt || a.createdAt).getTime())[0];
    await db.collection("users").updateOne(
      { email: { $regex: `^${email}$`, $options: "i" } },
      {
        $set: {
          isPremium: true,
          premiumPlan: latestTx.planName || "Annual Scholar Pro",
          premiumSince: latestTx.verifiedAt || latestTx.createdAt || new Date().toISOString(),
          razorpayPaymentId: latestTx.paymentId,
          razorpayOrderId: latestTx.orderId,
          updatedAt: new Date().toISOString(),
        }
      }
    );
  }

  // Set isPremium = false for any students without paid transactions (excluding admin)
  await db.collection("users").updateMany(
    {
      role: { $ne: "admin" },
      email: { $nin: Array.from(paidEmails) }
    },
    {
      $set: {
        isPremium: false
      }
    }
  );

  console.log("Database sync complete!");
  await client.close();
}

cleanupAndSync();
