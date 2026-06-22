const KEY_STORE    = 'intern_jsearch_key';
const SAVED_STORE  = 'intern_live_saved_v1';
const RATINGS_KEY  = 'intern_live_ratings_v1';
const STATUS_KEY   = 'intern_live_status_v1';

export type LiveAppStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

export interface LiveJob {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  salary?: string;
  postedAt: string;
  fetchedAt: number;
  score?: number; // compatibility 0–100
}

// ── API key ────────────────────────────────────────────────────────────────
const ENV_KEY = import.meta.env.VITE_RAPIDAPI_KEY as string | undefined;

export function getApiKey(): string {
  return localStorage.getItem(KEY_STORE) || ENV_KEY || '';
}
export function saveApiKey(k: string): void { localStorage.setItem(KEY_STORE, k.trim()); }
export function clearApiKey(): void  { localStorage.removeItem(KEY_STORE); }

// ── Saved live jobs ────────────────────────────────────────────────────────
export function getSavedLiveJobs(): Record<string, LiveJob> {
  try { return JSON.parse(localStorage.getItem(SAVED_STORE) ?? '{}'); }
  catch { return {}; }
}
export function saveLiveJob(job: LiveJob): void {
  const s = getSavedLiveJobs(); s[job.id] = job;
  localStorage.setItem(SAVED_STORE, JSON.stringify(s));
}
export function unsaveLiveJob(id: string): void {
  const s = getSavedLiveJobs(); delete s[id];
  localStorage.setItem(SAVED_STORE, JSON.stringify(s));
}

// ── Live Job Ratings (1–5 stars) ───────────────────────────────────────────
export function getAllLiveJobRatings(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(RATINGS_KEY) ?? '{}'); } catch { return {}; }
}
export function getLiveJobRating(id: string): number {
  return getAllLiveJobRatings()[id] ?? 0;
}
export function setLiveJobRating(id: string, rating: number): void {
  const r = getAllLiveJobRatings(); r[id] = rating;
  localStorage.setItem(RATINGS_KEY, JSON.stringify(r));
}

// ── Live Job Tracker statuses ──────────────────────────────────────────────
export function getLiveJobStatuses(): Record<string, LiveAppStatus> {
  try { return JSON.parse(localStorage.getItem(STATUS_KEY) ?? '{}'); } catch { return {}; }
}
export function setLiveJobStatus(id: string, status: LiveAppStatus): void {
  const s = getLiveJobStatuses(); s[id] = status;
  localStorage.setItem(STATUS_KEY, JSON.stringify(s));
}
export function removeLiveJobStatus(id: string): void {
  const s = getLiveJobStatuses(); delete s[id];
  localStorage.setItem(STATUS_KEY, JSON.stringify(s));
}

// ── Fetch ──────────────────────────────────────────────────────────────────
function cleanText(html: string, maxLen = 240): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/&#\d+;/g, '').replace(/&[a-z]+;/gi, '')
    .replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

const MAX_AGE_MS = 180 * 86_400_000;
function isRecent(postedAt: string): boolean {
  const t = new Date(postedAt).getTime();
  return isNaN(t) || Date.now() - t < MAX_AGE_MS;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapJob(j: any): LiveJob {
  return {
    id:          String(j.job_id),
    title:       String(j.job_title   ?? ''),
    company:     String(j.employer_name ?? ''),
    location:    [j.job_city, j.job_state ?? j.job_country].filter(Boolean).join(', '),
    url:         String(j.job_apply_link ?? ''),
    description: cleanText(String(j.job_description ?? '')),
    salary: j.job_min_salary
      ? `$${Number(j.job_min_salary).toLocaleString()}–$${Number(j.job_max_salary).toLocaleString()}`
      : undefined,
    postedAt:  String(j.job_posted_at_datetime_utc ?? new Date().toISOString()),
    fetchedAt: Date.now(),
  };
}

export async function fetchLiveJobs(query: string, apiKey: string, pages = 1, dateWindow: 'week' | '3days' | 'month' = '3days'): Promise<LiveJob[]> {
  const url =
    `https://jsearch.p.rapidapi.com/search` +
    `?query=${encodeURIComponent(query)}&page=1&num_pages=${pages}&date_posted=${dateWindow}`;

  const res = await fetch(url, {
    headers: {
      'x-rapidapi-key':  apiKey,
      'x-rapidapi-host': 'jsearch.p.rapidapi.com',
    },
  });

  if (res.status === 401 || res.status === 403) throw new Error('invalid_key');
  if (res.status === 429) throw new Error('quota_exceeded');
  if (!res.ok) throw new Error(`api_${res.status}`);

  const data = await res.json();
  return (data.data ?? []).map(mapJob);
}

// ── Live Feed query rotation ────────────────────────────────────────────────
export const LIVE_QUERIES = [
  // CA
  'software engineering internship California 2025',
  'data science internship California',
  'computer science intern Silicon Valley',
  'machine learning AI internship San Francisco',
  // TX
  'engineering internship Texas 2025',
  'petroleum engineering intern Houston Texas',
  'software developer intern Austin Texas',
  'mechanical engineering internship Texas',
  // GCC / MENA
  'engineering internship Saudi Arabia Riyadh 2025',
  'software intern UAE Dubai Abu Dhabi',
  'engineering intern Qatar Doha 2025',
  'internship Kuwait Bahrain Oman engineering',
  'tech intern MENA region 2025',
  'data science intern Saudi Arabia',
  'computer science internship Middle East',
  'internship Aramco SABIC ADNOC 2025',
  'mechanical engineering internship Saudi Arabia UAE 2025',
  'petroleum engineering internship Kuwait Oman 2025',
  'chemical engineering internship Qatar Bahrain 2025',
  'civil engineering internship Middle East GCC 2025',
  // AU / NZ
  'software engineering internship Australia 2025',
  'engineering internship Sydney Melbourne Brisbane 2025',
  'engineering internship New Zealand Auckland 2025',
  'tech internship Australia New Zealand 2025',
  // General
  'software engineering internship summer 2025',
  'electrical engineering internship 2025',
  'data analyst internship 2025',
  'systems engineering intern',
  'AI machine learning internship 2025',
];

// ── Daily Browse cache (100-150 jobs, refreshes every 24h) ─────────────────
const BROWSE_CACHE_KEY = 'intern_browse_cache_v1';
const BROWSE_CACHE_TTL = 24 * 60 * 60 * 1000;

const BROWSE_QUERIES = [
  'software engineering internship 2025',
  'engineering internship California Texas 2025',
  'engineering internship Saudi Arabia UAE Qatar 2025',
  'data science machine learning internship 2025',
  'computer science internship summer 2025',
  'mechanical electrical engineering internship',
  'engineering internship Australia New Zealand 2025',
  'internship Aramco SABIC ADNOC QatarEnergy 2025',
  'materials science engineering internship research 2025',
  'petroleum chemical engineering internship 2025',
  'engineering internship Kuwait Bahrain Oman 2025',
  'AI robotics systems engineering internship 2025',
];

export async function fetchDailyBrowseJobs(apiKey = ''): Promise<LiveJob[]> {
  try {
    const raw = localStorage.getItem(BROWSE_CACHE_KEY);
    if (raw) {
      const c = JSON.parse(raw);
      if (c?.ts && Date.now() - c.ts < BROWSE_CACHE_TTL && Array.isArray(c.jobs) && c.jobs.length >= 30) {
        return c.jobs as LiveJob[];
      }
    }
  } catch { /* stale or corrupt cache */ }

  const seen = new Set<string>();
  const jobs: LiveJob[] = [];
  const add = (batch: LiveJob[]) => { for (const j of batch) { if (!seen.has(j.id)) { seen.add(j.id); jobs.push(j); } } };

  // JSearch (when key available)
  if (apiKey) {
    const intlKw = ['saudi','uae','qatar','australia','new zealand','kuwait','bahrain','oman','aramco','adnoc','sabic'];
    for (const q of BROWSE_QUERIES) {
      try {
        const isIntl = intlKw.some(k => q.toLowerCase().includes(k));
        add(await fetchLiveJobs(q, apiKey, 3, isIntl ? 'week' : '3days'));
      } catch { /* quota or error — continue to free sources */ }
    }
  }

  // Free sources — always run (supplement JSearch or replace when quota hit)
  const freeResults = await Promise.allSettled([
    fetchRemotiveJobs('engineering intern'),
    fetchRemotiveJobs('software engineering intern'),
    fetchRemotiveJobs('materials science intern'),
    fetchTheMuseJobs(0),
    fetchTheMuseJobs(1),
    fetchJobicyJobs('engineering'),
    fetchJobicyJobs('software'),
    fetchRemoteOKJobs(),
  ]);
  freeResults.forEach(r => { if (r.status === 'fulfilled') add(r.value); });

  // Jooble MENA + AU/NZ (if key available) — adds 10 per region to browse
  const joobleKey = import.meta.env.VITE_JOOBLE_KEY;
  if (joobleKey) {
    const intlResults = await Promise.allSettled([
      fetchJoobleJobs(joobleKey, 'engineering internship 2025', 'Saudi Arabia'),
      fetchJoobleJobs(joobleKey, 'engineering internship', 'UAE'),
      fetchJoobleJobs(joobleKey, 'engineering internship', 'Qatar'),
      fetchJoobleJobs(joobleKey, 'engineering internship 2025', 'Australia'),
      fetchJoobleJobs(joobleKey, 'engineering internship', 'New Zealand'),
    ]);
    intlResults.forEach(r => { if (r.status === 'fulfilled') add(r.value); });
  }

  try {
    localStorage.setItem(BROWSE_CACHE_KEY, JSON.stringify({ ts: Date.now(), jobs }));
  } catch { /* storage full */ }

  return jobs;
}

// ── RemoteOK — free, no key, CORS-enabled, remote-only jobs ───────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRemoteOK(j: any): LiveJob {
  const salaryMin = j.salary_min ? Number(j.salary_min) : 0;
  const salaryMax = j.salary_max ? Number(j.salary_max) : Math.round(salaryMin * 1.25);
  return {
    id: 'rok_' + String(j.id ?? j.slug ?? Math.random()),
    title: String(j.position ?? ''),
    company: String(j.company ?? ''),
    location: 'Remote',
    url: String(j.url ?? j.apply_url ?? ''),
    description: cleanText(String(j.description ?? '')),
    salary: salaryMin > 0 ? `$${salaryMin.toLocaleString()}–$${salaryMax.toLocaleString()}` : undefined,
    postedAt: j.date ? String(j.date) : (j.epoch ? new Date(Number(j.epoch) * 1000).toISOString() : new Date().toISOString()),
    fetchedAt: Date.now(),
  };
}

const INTERN_RE = /intern|jr\.?\b|junior|graduate\s+eng|entry[\s-]level|new\s+grad/i;

export async function fetchRemoteOKJobs(): Promise<LiveJob[]> {
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data) ? data.slice(1) : [];
    return items
      .filter((j: any) => INTERN_RE.test(String(j.position ?? '')) || (Array.isArray(j.tags) && j.tags.includes('intern')))
      .slice(0, 25)
      .map(mapRemoteOK);
  } catch {
    return [];
  }
}

// ── Jooble — free key, 67 countries, GCC + AU/NZ coverage ─────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapJooble(j: any, locationHint: string): LiveJob {
  return {
    id: 'jbl_' + String(j.id ?? Math.random()),
    title: String(j.title ?? ''),
    company: String(j.company ?? ''),
    location: String(j.location ?? locationHint),
    url: String(j.link ?? ''),
    description: cleanText(String(j.snippet ?? '')),
    salary: j.salary ? String(j.salary).slice(0, 40) : undefined,
    postedAt: j.updated ? new Date(j.updated).toISOString() : new Date().toISOString(),
    fetchedAt: Date.now(),
  };
}

export async function fetchJoobleJobs(apiKey: string, keywords: string, location: string): Promise<LiveJob[]> {
  try {
    const res = await fetch(`https://jooble.org/api/${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords, location, resultsOnPage: 20 }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs ?? [])
      .filter((j: any) => isRecent(j.updated ? new Date(j.updated).toISOString() : ''))
      .map((j: any) => mapJooble(j, location));
  } catch {
    return []; // silently fail on CORS or network errors
  }
}

// ── Adzuna — 250 free calls/month, strong AU/NZ/US, CORS-enabled ──────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAdzuna(j: any, country: string): LiveJob {
  const salaryMin = j.salary_min ? Number(j.salary_min) : 0;
  const salaryMax = j.salary_max ? Number(j.salary_max) : Math.round(salaryMin * 1.2);
  return {
    id: 'adz_' + String(j.id ?? Math.random()),
    title: String(j.title ?? ''),
    company: String(j.company?.display_name ?? ''),
    location: String(j.location?.display_name ?? country.toUpperCase()),
    url: String(j.redirect_url ?? ''),
    description: cleanText(String(j.description ?? '')),
    salary: salaryMin > 0 ? `$${salaryMin.toLocaleString()}–$${salaryMax.toLocaleString()}` : undefined,
    postedAt: j.created ?? new Date().toISOString(),
    fetchedAt: Date.now(),
  };
}

export async function fetchAdzunaJobs(appId: string, appKey: string, what: string, country: string): Promise<LiveJob[]> {
  try {
    const params = new URLSearchParams({ app_id: appId, app_key: appKey, results_per_page: '20', what });
    const res = await fetch(`https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map((j: any) => mapAdzuna(j, country));
  } catch {
    return [];
  }
}

// ── Remotive — free, no key, remote jobs, unlimited ───────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRemotive(j: any): LiveJob {
  return {
    id: 'rem_' + String(j.id ?? Math.random()),
    title: String(j.title ?? ''),
    company: String(j.company_name ?? ''),
    location: String(j.candidate_required_location || 'Remote'),
    url: String(j.url ?? ''),
    description: cleanText(String(j.description ?? '')),
    salary: j.salary ? String(j.salary).slice(0, 50) : undefined,
    postedAt: j.publication_date ? new Date(j.publication_date).toISOString() : new Date().toISOString(),
    fetchedAt: Date.now(),
  };
}

export async function fetchRemotiveJobs(search: string): Promise<LiveJob[]> {
  try {
    const params = new URLSearchParams({ search, limit: '50' });
    const res = await fetch(`https://remotive.com/api/remote-jobs?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs ?? []).filter((j: any) => INTERN_RE.test(String(j.title ?? ''))).map(mapRemotive);
  } catch {
    return [];
  }
}

// ── The Muse — free, no key (500 req/hr), internship category ─────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTheMuse(j: any): LiveJob {
  return {
    id: 'muse_' + String(j.id ?? Math.random()),
    title: String(j.name ?? ''),
    company: String(j.company?.name ?? ''),
    location: (j.locations ?? [])[0]?.name ?? 'Various',
    url: String(j.refs?.landing_page ?? ''),
    description: cleanText(String(j.contents ?? '')),
    salary: undefined,
    postedAt: j.publication_date ? new Date(j.publication_date).toISOString() : new Date().toISOString(),
    fetchedAt: Date.now(),
  };
}

export async function fetchTheMuseJobs(page: number): Promise<LiveJob[]> {
  try {
    const params = new URLSearchParams({ category: 'Engineering', level: 'Internship', page: String(page) });
    const res = await fetch(`https://www.themuse.com/api/public/jobs?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map(mapTheMuse);
  } catch {
    return [];
  }
}

// ── Jobicy — free, no key, remote internships, global ─────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapJobicy(j: any): LiveJob {
  const salMin = j.annualSalaryMin ? Number(j.annualSalaryMin) : 0;
  const salMax = j.annualSalaryMax ? Number(j.annualSalaryMax) : 0;
  return {
    id: 'jcy_' + String(j.id ?? Math.random()),
    title: String(j.jobTitle ?? ''),
    company: String(j.companyName ?? ''),
    location: String(j.jobGeo || 'Remote'),
    url: String(j.url ?? ''),
    description: cleanText(String(j.jobDescription ?? '')),
    salary: salMin > 0 ? `$${salMin.toLocaleString()}–$${salMax.toLocaleString()}` : undefined,
    postedAt: j.pubDate ? new Date(j.pubDate).toISOString() : new Date().toISOString(),
    fetchedAt: Date.now(),
  };
}

export async function fetchJobicyJobs(tag: string): Promise<LiveJob[]> {
  try {
    const params = new URLSearchParams({ count: '50', tag });
    const res = await fetch(`https://jobicy.com/api/v0/remote-jobs?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs ?? []).filter((j: any) => INTERN_RE.test(String(j.jobTitle ?? ''))).map(mapJobicy);
  } catch {
    return [];
  }
}
