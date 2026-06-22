function parseCookies(header) {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k.trim(), decodeURIComponent(v.join('='))];
    })
  );
}

export default function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  res.json({ connected: !!cookies.gmail_connected });
}
