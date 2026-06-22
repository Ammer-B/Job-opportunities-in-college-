import { useState } from 'react';
import { loadProfile, saveProfile, resetProfile } from '../utils/userProfile';

interface ProfileProps {
  theme: 'light' | 'dark';
  onThemeChange: (t: 'light' | 'dark') => void;
}

export default function Profile({ theme, onThemeChange }: ProfileProps) {
  const [profile, setProfile] = useState(loadProfile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(profile);
  const [saved, setSaved]     = useState(false);
  const [newSkill, setNewSkill] = useState('');

  const [regCA, setRegCA]   = useState(true);
  const [regTX, setRegTX]   = useState(true);
  const [regGCC, setRegGCC] = useState(true);
  const [regAU, setRegAU]   = useState(false);
  const [roleEng, setRoleEng]   = useState(true);
  const [roleData, setRoleData] = useState(true);

  function commitSave() {
    setProfile(draft);
    saveProfile(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    resetProfile();
    const fresh = loadProfile();
    setProfile(fresh);
    setDraft(fresh);
    setEditing(false);
  }

  function removeSkill(skill: string) {
    setDraft(d => ({ ...d, skills: (d.skills ?? []).filter((s: string) => s !== skill) }));
  }

  function addSkill() {
    const t = newSkill.trim();
    if (!t || (draft.skills ?? []).includes(t)) { setNewSkill(''); return; }
    setDraft(d => ({ ...d, skills: [...(d.skills ?? []), t] }));
    setNewSkill('');
  }

  const initials = profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="it-pad" style={{ padding: 36, maxWidth: 720, margin: '0 auto' }}>

      {/* User card */}
      <div style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 20, padding: 28, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', boxShadow: '0 1px 2px rgba(45,28,16,0.04)' }}>
        <div style={{ width: 74, height: 74, borderRadius: '50%', background: 'linear-gradient(135deg,#e0322f,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 30, color: '#fff', flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <h1 className="syne" style={{ fontWeight: 800, fontSize: 24, color: 'var(--t1)', margin: '0 0 4px' }}>{profile.name}</h1>
          <div style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 10 }}>{profile.major} · {profile.school} · GPA {profile.gpa}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(224,50,47,0.1)', color: 'var(--acc)', padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>Level 3 Intern Hunter</span>
            <span style={{ background: 'rgba(234,88,12,0.1)', color: '#c2570e', padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>🔥 7-Day Streak</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          {editing ? (
            <>
              <button className="btn-acc" style={{ padding: '9px 18px' }} onClick={commitSave}>Save changes</button>
              <button className="btn-ghost" style={{ padding: '9px 18px' }} onClick={() => { setEditing(false); setDraft(profile); }}>Cancel</button>
              <button onClick={handleReset} style={{ fontSize: 11, color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}>Reset defaults</button>
            </>
          ) : (
            <button className="btn-ghost" style={{ padding: '9px 18px' }} onClick={() => { setDraft(profile); setEditing(true); }}>Edit Profile</button>
          )}
        </div>
      </div>

      {saved && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 12, marginBottom: 16, color: '#16893f', fontSize: 14, fontWeight: 600 }}>
          ✓ Profile saved — cover letters will use your updated info.
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div style={{ background: 'var(--surf)', border: '1px solid rgba(224,50,47,0.2)', borderRadius: 16, padding: 24, marginBottom: 18, boxShadow: '0 1px 2px rgba(45,28,16,0.04)' }}>
          <h3 className="syne" style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)', margin: '0 0 4px' }}>Edit Your Profile</h3>
          <p style={{ fontSize: 13, color: 'var(--t2)', margin: '0 0 18px' }}>Changes auto-update your cover letters across all internships.</p>

          {/* Basic info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {([
              ['Full Name', 'name'], ['Email', 'email'], ['Phone', 'phone'], ['Location', 'location'],
              ['University', 'school'], ['Major', 'major'], ['GPA', 'gpa'], ['Standing', 'standing'],
              ['Expected Graduation', 'graduation'],
            ] as [string, keyof typeof draft][]).map(([label, key]) => (
              <div key={key}>
                <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 5, textTransform: 'uppercase' }}>{label}</div>
                <input
                  className="field"
                  value={String(draft[key] ?? '')}
                  onChange={e => setDraft({ ...draft, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>

          {/* Skills editing */}
          <div style={{ borderTop: '1px solid var(--bdr)', paddingTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 12, textTransform: 'uppercase' }}>Skills</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {(draft.skills ?? []).map((s: string) => (
                <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px 5px 12px', background: 'var(--elev)', border: '1px solid var(--bdr)', borderRadius: 8, fontSize: 12, color: 'var(--t2)', fontWeight: 500 }}>
                  {s}
                  <button
                    onClick={() => removeSkill(s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 0, fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center' }}
                  >×</button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="field"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkill()}
                placeholder="Add a skill…"
                style={{ flex: 1 }}
              />
              <button
                className="btn-ghost"
                style={{ padding: '10px 16px', flexShrink: 0 }}
                onClick={addSkill}
              >Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Appearance / Dark mode */}
      <div style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: '0 1px 2px rgba(45,28,16,0.04)' }}>
        <h3 className="syne" style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)', margin: '0 0 6px' }}>Appearance</h3>
        <p style={{ fontSize: 13, color: 'var(--t2)', margin: '0 0 16px' }}>Choose your preferred color scheme</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onThemeChange('light')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: theme === 'light' ? 'rgba(224,50,47,0.1)' : 'var(--elev)', border: `1px solid ${theme === 'light' ? 'rgba(224,50,47,0.3)' : 'var(--bdr)'}`, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: theme === 'light' ? 'var(--acc)' : 'var(--t2)', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.15s' }}
          >
            ☀️ Light
          </button>
          <button
            onClick={() => onThemeChange('dark')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: theme === 'dark' ? 'rgba(224,50,47,0.1)' : 'var(--elev)', border: `1px solid ${theme === 'dark' ? 'rgba(224,50,47,0.3)' : 'var(--bdr)'}`, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: theme === 'dark' ? 'var(--acc)' : 'var(--t2)', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.15s' }}
          >
            🌙 Dark
          </button>
        </div>
      </div>

      {/* Target Regions */}
      <div style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: '0 1px 2px rgba(45,28,16,0.04)' }}>
        <h3 className="syne" style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)', margin: '0 0 6px' }}>Target Regions</h3>
        <p style={{ fontSize: 13, color: 'var(--t2)', margin: '0 0 16px' }}>Toggle which regions appear in your search</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className={`tog${regCA ? ' tog-on' : ''}`} onClick={() => setRegCA(v => !v)}>🌉 California</button>
          <button className={`tog${regTX ? ' tog-on' : ''}`} onClick={() => setRegTX(v => !v)}>⭐ Texas</button>
          <button className={`tog${regGCC ? ' tog-on' : ''}`} onClick={() => setRegGCC(v => !v)}>🌙 GCC</button>
          <button className={`tog${regAU ? ' tog-on' : ''}`} onClick={() => setRegAU(v => !v)}>🦘 AU / NZ</button>
        </div>
      </div>

      {/* Role Preferences */}
      <div style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: '0 1px 2px rgba(45,28,16,0.04)' }}>
        <h3 className="syne" style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)', margin: '0 0 6px' }}>Role Preferences</h3>
        <p style={{ fontSize: 13, color: 'var(--t2)', margin: '0 0 16px' }}>What kind of internship are you hunting for?</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className={`tog${roleEng ? ' tog-on' : ''}`} onClick={() => setRoleEng(v => !v)}>Engineering</button>
          <button className={`tog${roleData ? ' tog-on' : ''}`} onClick={() => setRoleData(v => !v)}>Data Science</button>
        </div>
      </div>

      {/* Academic Info */}
      <div style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: '0 1px 2px rgba(45,28,16,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 className="syne" style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)', margin: 0 }}>Academic Info</h3>
          {!editing && (
            <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => { setDraft(profile); setEditing(true); }}>Edit →</button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {[
            ['UNIVERSITY', profile.school],
            ['MAJOR', profile.major],
            ['GRADUATION', profile.graduation],
            ['GPA', String(profile.gpa)],
            ['STANDING', profile.standing],
            ['LANGUAGES', profile.languages?.join(', ') ?? 'English, Arabic'],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 5, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
              <div style={{ fontSize: 14, color: 'var(--t1)', fontWeight: 600 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: '0 1px 2px rgba(45,28,16,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 className="syne" style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)', margin: 0 }}>Skills</h3>
          {!editing && (
            <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => { setDraft(profile); setEditing(true); }}>Edit →</button>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(profile.skills ?? []).map((s: string) => (
            <span key={s} style={{ padding: '5px 12px', background: 'var(--elev)', border: '1px solid var(--bdr)', borderRadius: 8, fontSize: 12, color: 'var(--t2)', fontWeight: 500 }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Resume */}
      <div style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 16, padding: 24, boxShadow: '0 1px 2px rgba(45,28,16,0.04)' }}>
        <h3 className="syne" style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)', margin: '0 0 16px' }}>Resume</h3>
        <div style={{ border: '2px dashed rgba(224,50,47,0.25)', borderRadius: 12, padding: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', background: 'rgba(224,50,47,0.02)' }}>
          <div style={{ width: 46, height: 46, background: 'rgba(224,50,47,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e0322f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Ammer_Resume_2025.pdf</div>
          <div style={{ fontSize: 12, color: 'var(--t2)' }}>Click to upload or replace</div>
        </div>
      </div>
    </div>
  );
}
