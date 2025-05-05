export default async function handler(req, res) {
  const token = req.body['cf-turnstile-response'];
  const secret = '0x4AAAAAABZIICZCpnFR5w-RZcVFsuk7y4k'; // Key

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${secret}&response=${token}`
  });

  const data = await response.json();

  if (data.success) {
    res.status(200).json({ success: true });
  } else {
    res.status(403).json({ success: false, errors: data['error-codes'] });
  }
}
