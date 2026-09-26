import fs from "node:fs";
import { MongoClient } from "mongodb";

let uri = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

try {
  if (fs.existsSync(".env.local")) {
    const envContent = fs.readFileSync(".env.local", "utf8");
    const m = envContent.match(/MONGODB_URI=(.*)/);
    if (m && m[1]) {
      uri = m[1].trim().replace(/^['"]|['"]$/g, "");
    }
  }
} catch (err) {
  console.error("Error reading .env.local", err);
}

if (!uri) {
  console.error("MONGODB_URI environment variable is required.");
  process.exit(1);
}

async function sync() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("scholarnexus");

    // 1. Sync from paid transactions
    const paidTxs = await db.collection("transactions").find({ status: "paid" }).toArray();
    console.log("Paid transactions found:", paidTxs.length);

    for (const tx of paidTxs) {
      if (tx.userEmail) {
        const normalizedEmail = tx.userEmail.trim().toLowerCase();
        const res = await db.collection("users").updateOne(
          {
            $or: [
              { email: normalizedEmail },
              { email: { $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
            ],
          },
          {
            $set: {
              isPremium: true,
              premiumPlan: tx.planName || "Annual Scholar Pro",
              premiumSince: tx.verifiedAt || tx.createdAt || new Date().toISOString(),
              razorpayPaymentId: tx.paymentId,
              razorpayOrderId: tx.orderId,
              updatedAt: new Date().toISOString(),
            },
          }
        );
        console.log(`Synced user [${normalizedEmail}]: matched ${res.matchedCount}, modified ${res.modifiedCount}`);
      }
    }

    const users = await db.collection("users").find({}).project({ email: 1, isPremium: 1, premiumPlan: 1, role: 1 }).toArray();
    console.log("All DB users:", JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("Sync error:", err);
  } finally {
    await client.close();
  }
}

sync();
