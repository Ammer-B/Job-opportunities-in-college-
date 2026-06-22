import { PROFILE as DEFAULT_PROFILE } from '../data/profile';

const KEY = 'interntrack_user_profile_v1';

export type UserProfile = typeof DEFAULT_PROFILE;

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function resetProfile(): void {
  localStorage.removeItem(KEY);
}
