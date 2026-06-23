export type Region = 'texas' | 'california' | 'ksa' | 'uae' | 'qatar' | 'kuwait' | 'bahrain' | 'oman' | 'australia' | 'new_zealand';
export type Industry = 'oil_gas' | 'semiconductor' | 'aerospace' | 'national_lab' | 'manufacturing' | 'mining';
export type AppStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';
export type InternshipWindow = 'spring_2026' | 'fall_2026' | 'summer_2027';
export type SortKey = 'composite' | 'pay_rate' | 'ease_of_entry' | 'future_benefits' | 'callback_percentage';
export type JobType = 'intern' | 'full_time' | 'part_time' | 'remote' | 'hybrid' | 'on_site';

export interface ScoreBreakdown {
  ease_of_entry: number;
  ease_of_commuting: number;
  pay_rate: number;
  callback_percentage: number;
  future_benefits: number;
}

export interface Internship {
  id: string;
  company: string;
  role: string;
  location: string;
  region: Region;
  industry: Industry[];
  windows: InternshipWindow[];
  job_type: JobType[];
  deadline?: string;
  application_url: string;
  recruiter_email?: string;
  description: string;
  requirements: string[];
  key_skills: string[];
  duration: string;
  pay_display: string;
  pay_hourly_equiv: number;
  scores: ScoreBreakdown;
  composite_score: number;
  arabic_advantage: boolean;
  ksa_career_path: boolean;
  research_focused: boolean;
  relocation_provided: boolean;
  why_good_fit: string;
  cover_letter_hook: string;
}

export interface ApplicationRecord {
  internship_id: string;
  status: AppStatus;
  applied_date: string | null;
  interview_date: string | null;
  notes: string;
  saved_date: string;
}

export interface FilterState {
  regions: Region[];
  industries: Industry[];
  windows: InternshipWindow[];
  job_types: JobType[];
  min_composite: number;
  search: string;
  sort_by: SortKey;
  show_ksa_path_only: boolean;
}
