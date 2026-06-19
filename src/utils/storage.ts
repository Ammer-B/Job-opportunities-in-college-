import type { ApplicationRecord, AppStatus } from '../types';

const KEY = 'intern_tracker_apps';

export function loadApplications(): Record<string, ApplicationRecord> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveApplication(record: ApplicationRecord): void {
  const all = loadApplications();
  all[record.internship_id] = record;
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function updateStatus(internshipId: string, status: AppStatus): void {
  const all = loadApplications();
  const existing = all[internshipId];
  if (existing) {
    existing.status = status;
    if (status === 'applied' && !existing.applied_date) {
      existing.applied_date = new Date().toISOString().split('T')[0];
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
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function removeApplication(internshipId: string): void {
  const all = loadApplications();
  delete all[internshipId];
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function updateNotes(internshipId: string, notes: string): void {
  const all = loadApplications();
  if (all[internshipId]) {
    all[internshipId].notes = notes;
    localStorage.setItem(KEY, JSON.stringify(all));
  }
}
