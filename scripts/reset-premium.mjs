import { MongoClient } from "mongodb";

// Attempt to load environment variables from .env / .env.local if supported
try {
  process.loadEnvFile?.(".env.local");
} catch {}
try {
  process.loadEnvFile?.(".env");
} catch {}

const uri = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI environment variable is required.");
  process.exit(1);
}

async function reset() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("scholarnexus");
    const res = await db.collection("users").updateMany(
      {},
      {
        $set: {
          isPremium: false,
          premiumPlan: null,
          premiumSince: null,
          razorpayPaymentId: null,
          razorpayOrderId: null,
        },
      },
    );
    console.log("Reset users isPremium count:", res.modifiedCount);

    const users = await db.collection("users").find({}).toArray();
    console.log(
      "Current users:",
      users.map((u) => ({ email: u.email, isPremium: u.isPremium })),
    );
  } finally {
    await client.close();
  }
}

reset();
