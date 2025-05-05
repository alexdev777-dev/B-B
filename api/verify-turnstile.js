  export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = req.body && req.body['cf-turnstile-response'];
    const secret = '0x4AAAAAABZIICZCpnFR5w-RZcVFsuk7y4k';

    if (!token) {
      return res.status(400).json({ error: "Token ausente" });
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secret}&response=${token}`
    });

    const data = await response.json();

    if (data.success) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(403).json({ success: false, errors: data['error-codes'] });
    }
  } catch (err) {
    console.error('Erro no verify-turnstile:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

