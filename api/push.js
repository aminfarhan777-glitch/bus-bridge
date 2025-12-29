export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const FIREBASE_DB = process.env.FIREBASE_DB_URL; // letak dalam Vercel env
  const url = `${FIREBASE_DB}/bus/location.json`;

  const payload = req.body; // JSON dari ESP32/AIR780E

  const fb = await fetch(url, {
    method: "PUT", // overwrite bus/location
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await fb.text();
  res.status(fb.status).send(text);
}