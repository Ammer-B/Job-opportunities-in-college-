import type { ApplicationRecord, AppStatus } from '../types';

const KEY = 'intern_tracker_apps_v1';

export function loadApplications(): Record<string, ApplicationRecord> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persist(data: Record<string, ApplicationRecord>) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function updateStatus(internshipId: string, status: AppStatus): void {
  const all = loadApplications();
  const existing = all[internshipId];
  if (existing) {
    existing.status = status;
    const today = new Date().toISOString().split('T')[0];
    if (status === 'applied' && !existing.applied_date) {
      existing.applied_date = today;
    }
    if (status === 'interview' && !existing.interview_date) {
      existing.interview_date = today;
    }
  } else {
    all[internshipId] = {
      internship_id: internshipId,
      status,
      applied_date: status === 'applied' ? new Date().toISOString().split('T')[0] : null,
      interview_date: null,
      notes: '',
      saved_date: new Date().toISOString().split('T')[0],
    };
  }
  persist(all);
}

export function removeApplication(internshipId: string): void {
  const all = loadApplications();
  delete all[internshipId];
  persist(all);
}

export function updateNotes(internshipId: string, notes: string): void {
  const all = loadApplications();
  if (all[internshipId]) {
    all[internshipId].notes = notes;
    persist(all);
  }
}
