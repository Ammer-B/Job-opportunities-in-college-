function parseCookies(header) {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k.trim(), decodeURIComponent(v.join('='))];
    })
  );
}

async function getAccessToken(refreshToken) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  return data.access_token;
}

async function searchMessages(accessToken, query, maxResults = 20) {
  const params = new URLSearchParams({ q: query, maxResults });
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  return data.messages || [];
}

async function getMessage(accessToken, id) {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return res.json();
}

function getHeader(msg, name) {
  return msg.payload?.headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function detectType(subject, snippet) {
  const text = (subject + ' ' + snippet).toLowerCase();
  const rejectionWords = [
    'unfortunately', 'not moving forward', 'other candidates', 'not selected',
    'decided not to', 'not be moving', 'not been selected', 'position has been filled',
    'will not be', 'unable to offer', 'regret to inform', 'not a match',
    'not be proceeding', 'not be considered', 'thank you for your interest',
  ];
  const offerWords = [
    'offer', 'congratulations', 'pleased to inform', 'excited to offer',
    'extend an offer', 'welcome to', 'next steps', 'start date',
  ];
  const interviewWords = [
    'interview', 'schedule a call', 'phone screen', 'video call',
    'meet with', 'speak with you', 'next round',
  ];

  if (offerWords.some(w => text.includes(w))) return 'offer';
  if (rejectionWords.some(w => text.includes(w))) return 'rejected';
  if (interviewWords.some(w => text.includes(w))) return 'interview';
  return null;
}

export default async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const refreshToken = cookies.gmail_rt;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Gmail not connected' });
  }

  try {
    const accessToken = await getAccessToken(refreshToken);

    if (!accessToken) {
      return res.status(401).json({ error: 'Failed to refresh token' });
    }

    // Search for internship-related emails from the last 180 days
    const QUERY = '(internship OR intern OR application OR "thank you for applying" OR "your application" OR "position" OR "role") newer_than:180d';
    const messageRefs = await searchMessages(accessToken, QUERY, 30);

    if (!messageRefs.length) {
      return res.json({ results: [] });
    }

    // Fetch details for each message in parallel (max 20)
    const messages = await Promise.all(
      messageRefs.slice(0, 20).map(m => getMessage(accessToken, m.id))
    );

    const results = [];
    for (const msg of messages) {
      const subject = getHeader(msg, 'Subject');
      const from = getHeader(msg, 'From');
      const date = getHeader(msg, 'Date');
      const snippet = msg.snippet ?? '';
      const type = detectType(subject, snippet);

      if (!type) continue;

      // Extract company name from From field (e.g. "Texas Instruments <noreply@ti.com>")
      const companyMatch = from.match(/^"?([^"<]+)"?\s*</);
      const company = companyMatch ? companyMatch[1].trim() : from.split('@')[1]?.split('.')[0] ?? from;

      results.push({ id: msg.id, company, subject, from, date, snippet, type });
    }

    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Scan failed', detail: err.message });
  }
}
