export default async function handler(req, res) {
  // Allow GET for quick browser test
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "BUS-BRIDGE API is running. Use POST to send JSON."
    });
  }

  // Only allow POST for data push
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const data = req.body;

  return res.status(200).json({
    ok: true,
    received: data
  });
}