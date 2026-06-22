import type { LiveJob } from './jobsApi';

const MINSCORE_KEY = 'intern_min_score_v1';

export function getMinScore(): number {
  return parseInt(localStorage.getItem(MINSCORE_KEY) ?? '0', 10);
}
export function setMinScore(n: number): void {
  localStorage.setItem(MINSCORE_KEY, String(Math.max(0, Math.min(80, n))));
}

// Terms that indicate relevance to common majors
const MAJOR_TERM_MAP: [string, string[]][] = [
  ['materials', ['materials','material','metallurg','polymer','composite','alloy','ceramic','fabricat','microstructure','hardness','characteriz','fracture','corrosion','thin film','deposition']],
  ['mechanical', ['mechanical','thermodynamics','fluid','manufacturing','machine','thermal','heat transfer','dynamics','vibration','cad','solidworks','finite element','cfd']],
  ['electrical', ['electrical','circuit','power','signal','embedded','firmware','fpga','pcb','rf','semiconductor','verilog']],
  ['chemical', ['chemical','reaction','process','thermodynamics','separations','polymer','catalyst','refinery','petrochemical','distillation']],
  ['petroleum', ['petroleum','reservoir','drilling','production','upstream','downstream','oil','gas','completion','well','geolog']],
  ['computer', ['software','algorithm','backend','frontend','full stack','react','python','javascript','database','api','cloud','devops','machine learning','deep learning']],
  ['data', ['data','analytics','sql','statistics','tableau','power bi','r','pandas','numpy','visualization','etl','pipeline']],
];

function getMajorTerms(major: string): string[] {
  const m = major.toLowerCase();
  const out: string[] = [];
  for (const [key, terms] of MAJOR_TERM_MAP) {
    if (m.includes(key)) out.push(...terms);
  }
  return out.length > 0 ? out : ['engineer','intern','research','science','technical'];
}

export interface ScoredProfile {
  skills: string[];
  major: string;
}

export function scoreJob(job: LiveJob, profile: ScoredProfile): number {
  const text = (job.title + ' ' + (job.description ?? '') + ' ' + job.company).toLowerCase();
  let score = 0;

  // ── Skill match (0–40) ────────────────────────────────────────────────────
  const skills = (profile.skills ?? []).map(s => s.toLowerCase());
  if (skills.length > 0) {
    const hits = skills.filter(s => text.includes(s)).length;
    score += Math.round((hits / skills.length) * 40);
  }

  // ── Field / major relevance (0–30) ────────────────────────────────────────
  const fieldTerms = getMajorTerms(profile.major ?? '');
  const fieldHits = fieldTerms.filter(t => text.includes(t)).length;
  score += Math.round(Math.min(1, fieldHits / Math.max(1, fieldTerms.length / 4)) * 30);

  // ── Location preference (0–20) ────────────────────────────────────────────
  const loc = (job.location + ' ' + job.title).toLowerCase();
  if (['texas','houston','austin','dallas','fort worth',', tx'].some(k => loc.includes(k))) score += 20;
  else if (['california','san francisco','silicon valley',', ca','san jose','los angeles','san diego'].some(k => loc.includes(k))) score += 17;
  else if (['saudi','riyadh','uae','dubai','qatar','doha','gcc','mena','aramco','sabic','adnoc','kuwait','oman','bahrain'].some(k => loc.includes(k))) score += 14;
  else if (['australia','sydney','melbourne','brisbane','new zealand','auckland'].some(k => loc.includes(k))) score += 12;
  else score += 5;

  // ── Recency (0–10) ────────────────────────────────────────────────────────
  const daysOld = (Date.now() - new Date(job.postedAt).getTime()) / 86_400_000;
  if (daysOld < 1)       score += 10;
  else if (daysOld < 2)  score += 8;
  else if (daysOld < 4)  score += 5;
  else if (daysOld < 7)  score += 2;

  return Math.round(Math.min(100, Math.max(0, score)));
}

export function scoreColor(score: number): { bg: string; text: string } {
  if (score >= 70) return { bg: 'rgba(22,163,74,0.13)',  text: '#16893f' };
  if (score >= 45) return { bg: 'rgba(217,119,6,0.13)',  text: '#b45309' };
  return                  { bg: 'rgba(159,18,57,0.10)',  text: '#9f1239' };
}
