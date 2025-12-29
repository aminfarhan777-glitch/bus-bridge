// pages/api/push.js
import admin from "firebase-admin";

function initFirebase() {
  if (admin.apps.length) return;

  // Vercel Environment Variable:
  // FIREBASE_SERVICE_ACCOUNT_JSON  (string JSON)
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL, // e.g. https://xxxx-default-rtdb.asia-southeast1.firebasedatabase.app
  });
}

export default async function handler(req, res) {
  // Health check
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, message: "BUS-BRIDGE API running. Use POST /api/push" });
  }

  // Allow POST only
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed. Use POST." });
  }

  try {
    initFirebase();

    const { lat, lng, speedKmh, timestampMs } = req.body || {};

    if (lat == null || lng == null) {
      return res.status(400).json({ ok: false, error: "lat/lng required" });
    }

    const payload = {
      lat: Number(lat),
      lng: Number(lng),
      speedKmh: Number(speedKmh ?? 0),
      timestampMs: Date.now(), // server time
      clientTimestampMs: Number(timestampMs ?? 0),
    };

    const db = admin.database();

    // ✅ current location (Android app baca sini)
    await db.ref("bus/location").set(payload);

    // ✅ history list (push auto id)
    const ref = db.ref("bus/history").push();
    await ref.set(payload);

    return res.status(200).json({
      ok: true,
      message: "Saved to /bus/location and /bus/history",
      historyKey: ref.key,
    });
  } catch (e) {
    console.error("push error:", e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
}