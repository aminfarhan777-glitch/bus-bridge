// api/push.js
import admin from "firebase-admin";

function initFirebase() {
  if (admin.apps.length) return;

  // Vercel ENV (set dalam Project Settings → Environment Variables)
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

export default async function handler(req, res) {
  // Allow POST only
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, message: "Use POST to send JSON." });
  }

  try {
    initFirebase();

    const { lat, lng, speedKmh, timestampMs } = req.body || {};

    // basic validation
    if (lat == null || lng == null) {
      return res.status(400).json({ ok: false, error: "lat/lng required" });
    }

    const payload = {
      lat: Number(lat),
      lng: Number(lng),
      speedKmh: Number(speedKmh ?? 0),
      // server timestamp (lagi reliable)
      timestampMs: Date.now(),
      // simpan timestamp client kalau nak
      clientTimestampMs: Number(timestampMs ?? 0),
    };

    const db = admin.database();

    // ✅ 1) Update CURRENT location (App Android baca sini)
    await db.ref("bus/location").set(payload);

    // ✅ 2) Push HISTORY (Firebase auto generate ID)
    const ref = db.ref("bus/history").push();
    await ref.set(payload);

    return res.status(200).json({
      ok: true,
      message: "Saved to /bus/location and /bus/history",
      historyKey: ref.key,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
}