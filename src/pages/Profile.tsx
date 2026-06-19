import { GraduationCap, MapPin, Phone, Mail, Code, FlaskConical, Globe } from 'lucide-react';
import { PROFILE } from '../data/profile';

export default function Profile() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-amber-900/30 to-slate-900/30 border border-amber-700/30 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-2xl font-black text-slate-950 shrink-0">
            AB
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{PROFILE.name}</h1>
            <p className="text-amber-300 font-medium">{PROFILE.major}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-400">
              <span className="flex items-center gap-1"><GraduationCap size={13} />{PROFILE.school}</span>
              <span className="flex items-center gap-1"><MapPin size={13} />{PROFILE.location}</span>
              <span className="flex items-center gap-1"><Mail size={13} />{PROFILE.email}</span>
              <span className="flex items-center gap-1"><Phone size={13} />{PROFILE.phone}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-amber-700/30">
          <div>
            <p className="text-xs text-slate-500">GPA</p>
            <p className="text-xl font-black text-emerald-400">{PROFILE.gpa}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Standing</p>
            <p className="text-xl font-black text-amber-400">{PROFILE.standing}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Graduation</p>
            <p className="text-xl font-black text-blue-400">{PROFILE.graduation}</p>
          </div>
        </div>
      </div>

      {/* Experience */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <h2 className="font-bold text-white flex items-center gap-2"><FlaskConical size={16} className="text-amber-400" /> Experience</h2>
        {PROFILE.experience.map((exp, idx) => (
          <div key={idx} className="border-l-2 border-amber-500/40 pl-4 space-y-1">
            <p className="font-semibold text-white text-sm">{exp.title}</p>
            <p className="text-xs text-amber-300">{exp.company} {'location' in exp ? `· ${exp.location}` : ''}</p>
            <p className="text-xs text-slate-500">{exp.dates}</p>
            <ul className="mt-2 space-y-1">
              {exp.bullets.map((b, bi) => (
                <li key={bi} className="text-xs text-slate-400 flex items-start gap-1.5">
                  <span className="text-amber-500 mt-0.5">–</span>{b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="font-bold text-white flex items-center gap-2"><Code size={16} className="text-amber-400" /> Skills</h2>
        <div className="flex flex-wrap gap-2">
          {PROFILE.skills.map(s => (
            <span key={s} className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg">{s}</span>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
        <h2 className="font-bold text-white flex items-center gap-2"><Globe size={16} className="text-amber-400" /> Languages</h2>
        <div className="flex gap-3">
          {PROFILE.languages.map(l => (
            <span key={l} className="px-4 py-2 bg-amber-900/30 border border-amber-700/40 text-amber-200 text-sm rounded-lg font-medium">{l}</span>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-1">Arabic fluency gives you a significant advantage for Saudi Arabia / MENA opportunities — use it in your cover letters.</p>
      </div>

      {/* Coursework */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
        <h2 className="font-bold text-white flex items-center gap-2"><GraduationCap size={16} className="text-amber-400" /> Relevant Coursework</h2>
        <div className="flex flex-wrap gap-2">
          {PROFILE.coursework.map(c => (
            <span key={c} className="px-3 py-1 bg-blue-900/30 border border-blue-800/40 text-blue-300 text-xs rounded-lg">{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
