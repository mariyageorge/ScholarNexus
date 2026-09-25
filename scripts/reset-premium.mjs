import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://mariyamathilel_db_user:gXvXqzA3jw47TRSl@scholarnexus.zjr2acd.mongodb.net';

async function reset() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('scholarnexus');
    const res = await db.collection('users').updateMany(
      {},
      {
        $set: {
          isPremium: false,
          premiumPlan: null,
          premiumSince: null,
          razorpayPaymentId: null,
          razorpayOrderId: null,
        },
      }
    );
    console.log('Reset users isPremium count:', res.modifiedCount);

    const users = await db.collection('users').find({}).toArray();
    console.log('Current users:', users.map(u => ({ email: u.email, isPremium: u.isPremium })));
  } finally {
    await client.close();
  }
}

reset();
