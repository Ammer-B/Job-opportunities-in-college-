import type { Internship } from '../types';
import { PROFILE } from '../data/profile';

export function generateCoverLetter(internship: Internship): string {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const ksaLine = internship.arabic_advantage
    ? '\nAs a native English and Arabic speaker, I am uniquely positioned to contribute not only technically but also culturally within your organization and its regional stakeholder relationships.'
    : '';

  return `${today}

Recruiting Team
${internship.company}
${internship.location}

Dear Hiring Manager,

I am writing to apply for the ${internship.role} position at ${internship.company}. As a Junior studying ${PROFILE.major} at ${PROFILE.school} with a GPA of ${PROFILE.gpa} and an expected graduation of ${PROFILE.graduation}, I bring a directly relevant combination of research experience, technical skills, and analytical ability.

${internship.cover_letter_hook}

In my current research roles at Texas A&M under Dr. Bilal Mansoor, I am simultaneously working on microfabrication process control (monitoring bath parameters including temperature, permittivity, and solution concentration for the LANL project) and solid-state materials processing (3D printing and friction stir processing to optimize mechanical and microstructural properties of metallic materials). Across both roles, I develop Python and VBA tools to automate data collection and improve experimental reproducibility — a skill I first applied professionally during my internship at PRNTD, where I built automated data analysis systems for product testing and supplier evaluation.

My coursework in Thermodynamics, Solid State Physics, Materials Characterization, and Mechanics of Materials provides the theoretical foundation to engage meaningfully from day one.${ksaLine}

I would welcome the opportunity to discuss how my background aligns with ${internship.company}'s needs. Please feel free to reach me at ${PROFILE.email} or ${PROFILE.phone}.

Sincerely,
${PROFILE.name}
Texas A&M University | College Station, TX
${PROFILE.email} | ${PROFILE.phone}`;
}

export function generateEmailSubject(internship: Internship): string {
  return `Internship Application — ${internship.role} | ${PROFILE.name} | Texas A&M '27`;
}
