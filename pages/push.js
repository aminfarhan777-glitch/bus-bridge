// api/push.js
import admin from "firebase-admin";

function initFirebase() {
  if (admin.apps.length) return;

  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

export default async function handler(req, res) {
  // 🔥 CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    console.log("OPTIONS request");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    console.log("NOT POST:", req.method);
    return res.status(200).json({
      ok: true,
      message: "Use POST to send JSON",
    });
  }

  try {
    console.log("POST BODY:", req.body);

    initFirebase();

    const { lat, lng, speedKmh, timestampMs } = req.body || {};

    if (lat == null || lng == null) {
      return res.status(400).json({ ok: false, error: "lat/lng required" });
    }

    const payload = {
      lat: Number(lat),
      lng: Number(lng),
      speedKmh: Number(speedKmh ?? 0),
      timestampMs: Date.now(),
      clientTimestampMs: Number(timestampMs ?? 0),
    };

    const db = admin.database();

    // 1️⃣ CURRENT
    await db.ref("bus/location").set(payload);

    // 2️⃣ HISTORY
    const ref = db.ref("bus/history").push();
    await ref.set(payload);

    console.log("SAVED:", ref.key);

    return res.status(200).json({
      ok: true,
      message: "Saved",
      historyKey: ref.key,
    });
  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
}