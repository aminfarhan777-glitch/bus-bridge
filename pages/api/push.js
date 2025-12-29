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
  // allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET") {
    return res.json({ ok: true, message: "BUS BRIDGE OK" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  try {
    initFirebase();

    const { lat, lng, speedKmh } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({ error: "lat/lng required" });
    }

    const payload = {
      lat: Number(lat),
      lng: Number(lng),
      speedKmh: Number(speedKmh ?? 0),
      timestampMs: Date.now(),
    };

    const db = admin.database();

    // current location
    await db.ref("bus/location").set(payload);

    // history
    await db.ref("bus/history").push(payload);

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
}