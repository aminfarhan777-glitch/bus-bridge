// api/push.js
import admin from "firebase-admin";

function initFirebase() {
  if (admin.apps.length) return;

  // ikut nama ENV yang kau set dekat Vercel
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JASON || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JASON (or _JSON)");

  const serviceAccount = JSON.parse(raw);

  const dbUrl = process.env.FIREBASE_DB_URL || process.env.FIREBASE_DATABASE_URL;
  if (!dbUrl) throw new Error("Missing FIREBASE_DB_URL (or FIREBASE_DATABASE_URL)");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: dbUrl,
  });
}

export default async function handler(req, res) {
  // CORS (optional tapi elok)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  // GET untuk test cepat (browser)
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, message: "BUS-BRIDGE API is running. Use POST /api/push" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Use POST" });
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
      timestampMs: Date.now(),
      clientTimestampMs: Number(timestampMs ?? 0),
    };

    const db = admin.database();

    // ✅ current location
    await db.ref("bus/location").set(payload);

    // ✅ history (auto ID)
    const h = db.ref("bus/history").push();
    await h.set(payload);

    return res.status(200).json({ ok: true, message: "Saved", historyKey: h.key });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}