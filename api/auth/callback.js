export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(302, '/?gmail_error=access_denied');
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokens.refresh_token) {
      return res.redirect(302, '/?gmail_error=no_refresh_token');
    }

    // Store refresh token in secure httpOnly cookie (1 year)
    res.setHeader('Set-Cookie', [
      `gmail_rt=${encodeURIComponent(tokens.refresh_token)}; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000; Path=/`,
      `gmail_connected=1; Secure; SameSite=Lax; Max-Age=31536000; Path=/`,
    ]);

    res.redirect(302, '/?gmail_connected=true');
  } catch {
    res.redirect(302, '/?gmail_error=token_exchange_failed');
  }
}
