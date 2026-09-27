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

async function inspect() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("scholarnexus");

  const txs = await db.collection("transactions").find({}).toArray();
  console.log("=== TRANSACTIONS COLLECTION (" + txs.length + ") ===");
  txs.forEach((t, i) => {
    console.log(`[${i+1}] Order: ${t.orderId} | Payment: ${t.paymentId} | Email: ${t.userEmail} | Amount: ${t.amountRupees} | Status: ${t.status} | Date: ${t.verifiedAt || t.createdAt}`);
  });

  const premiumUsers = await db.collection("users").find({ isPremium: true }).toArray();
  console.log("\n=== USERS WITH isPremium=true (" + premiumUsers.length + ") ===");
  premiumUsers.forEach((u, i) => {
    console.log(`[${i+1}] Name: ${u.name} | Email: ${u.email} | Role: ${u.role} | Plan: ${u.premiumPlan} | PaymentId: ${u.razorpayPaymentId}`);
  });

  await client.close();
}

inspect();
