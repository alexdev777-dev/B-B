export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // --- Country block (backend) ---
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress || "";
    const geoResp = await fetch(`http://ip-api.com/json/${ip}`);
    const geo = await geoResp.json();

    if (geo.countryCode !== 'US' && geo.countryCode !== 'BR') {
      return res.status(403).json({ error: "Form is only available for users from United States and Brazil." });
    }

    const { portalId, formId, cf_turnstile_response, ...fields } = req.body;
    const secret = '0x4AAAAAABZIICZCpnFR5w-RZcVFsuk7y4k';

    // --- Disposable email filter (backend) ---
    const disposableDomains = [
      'mailinator.com', 'yopmail.com', 'guerrillamail.com', 'temp-mail.org',
      '10minutemail.com', 'sharklasers.com', '.xyz'
    ];
    const email = fields.email || '';
    function isDisposableEmail(email) {
      if (!email) return false;
      const domain = email.split('@')[1]?.toLowerCase() || '';
      return disposableDomains.some(d =>
        domain.endsWith(d) || domain === d.replace(/^\./, '')
      );
    }
    if (isDisposableEmail(email)) {
      return res.status(400).json({ error: "Disposable emails are not allowed." });
    }

    // --- Turnstile validation ---
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secret}&response=${cf_turnstile_response}`
    });
    const result = await verify.json();

    if (!result.success) {
      return res.status(403).json({ error: "CAPTCHA invalid" });
    }

    // --- Build HubSpot fields ---
    const hubspotFields = Object.entries(fields).map(([name, value]) => ({
      name,
      value
    }));

    // --- Send to HubSpot ---
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
