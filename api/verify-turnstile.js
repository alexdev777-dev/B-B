export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { portalId, formId, cf_turnstile_response, ...fields } = req.body;
    const secret = '0x4AAAAAABZIICZCpnFR5w-RZcVFsuk7y4k';

    // Validação do Turnstile
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secret}&response=${cf_turnstile_response}`
    });
    const result = await verify.json();

    if (!result.success) {
      return res.status(403).json({ error: "CAPTCHA invalid" });
    }

    // Monta os campos para o HubSpot
    const hubspotFields = Object.entries(fields).map(([name, value]) => ({
      name,
      value
    }));

    // Envia para o HubSpot
    const hubspotResp = await fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: hubspotFields })
    });

    const hubspotResult = await hubspotResp.json();
    return res.status(200).json({ success: true, hubspot: hubspotResult });
  } catch (err) {
    console.error('Erro no form-submit:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
