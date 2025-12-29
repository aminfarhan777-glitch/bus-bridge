import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    databaseURL: process.env.FIREBASE_DB_URL,
  });
}

const db = admin.database();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({
      ok: true,
      message: "BUS-BRIDGE API is running. Use POST to send JSON.",
    });
  }

  try {
    const data = req.body;

    await db.ref("bus/location").set({
      lat: data.lat,
      lng: data.lng,
      speedKmh: data.speedKmh,
      timestampMs: Date.now(),
    });

    res.status(200).json({
      ok: true,
      message: "Data sent to Firebase",
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
}