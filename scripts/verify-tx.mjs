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

async function verifyTx() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("scholarnexus");

  const tx = await db.collection("transactions").findOne({ orderId: "order_TgEEMnS6yCOdQw" });
  console.log("PAID TX:", JSON.stringify(tx, null, 2));

  if (tx && (!tx.invoiceNumber || !tx.invoice)) {
    const invoiceNumber = tx.invoiceNumber || `INV-SN-2026-913431`;
    const invoiceData = {
      invoiceNumber,
      orderId: tx.orderId,
      paymentId: tx.paymentId,
      date: tx.verifiedAt || tx.createdAt || new Date().toISOString(),
      planId: tx.planId || "annual",
      planName: tx.planName || "Annual Scholar Pro",
      amountRupees: tx.amountRupees || 499,
      userName: "Kalyany S Nair",
      userEmail: tx.userEmail,
      affiliation: "Amal Jyothi College of Engineering",
      status: "paid",
      gateway: "Razorpay Payment Gateway",
    };

    await db.collection("transactions").updateOne(
      { orderId: tx.orderId },
      {
        $set: {
          invoiceNumber,
          userName: "Kalyany S Nair",
          planName: "Annual Scholar Pro",
          planId: "annual",
          amountRupees: 499,
          invoice: invoiceData,
        }
      }
    );
    console.log("Updated invoice data on transaction document.");
  }

  await client.close();
}

verifyTx();
