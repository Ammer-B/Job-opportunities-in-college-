export default function handler(req, res) {
  res.setHeader('Set-Cookie', [
    'gmail_rt=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/',
    'gmail_connected=; Secure; SameSite=Lax; Max-Age=0; Path=/',
  ]);
  res.json({ ok: true });
}
