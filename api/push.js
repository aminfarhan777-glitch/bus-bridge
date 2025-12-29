export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const data = req.body;

    if (!data || !data.lat || !data.lng) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    // sementara ni just test OK dulu
    return res.status(200).json({
      status: "success",
      received: data
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}