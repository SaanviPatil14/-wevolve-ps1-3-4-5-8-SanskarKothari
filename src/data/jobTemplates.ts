export type TemplateInput = {
  jobTitle: string;
  company?: string;
  industry?: string;
  experience?: 'Entry' | 'Mid' | 'Senior';
  skills: string[];
  culture?: 'Startup' | 'Corporate' | 'Remote-first';
  specialRequirements?: string;
};

export const skillResponsibilities: Record<string, string[]> = {
  Python: [
    'Develop and maintain Python-based applications.',
    'Write clean, maintainable code following PEP standards.'
  ],
  React: [
    'Build responsive web interfaces using React.',
    'Implement component-based architecture and reusable components.'
  ],
  SQL: [
    'Design and optimize SQL queries and database schemas.',
    'Work with relational databases to ensure data integrity.'
  ],
  AWS: [
    'Deploy and maintain services on AWS.',
    'Leverage AWS services for scalability and reliability.'
  ]
};

const industryTemplates: Record<string, string[]> = {
  Tech: [
    "We are looking for a passionate professional to help build and scale our product. You'll work on full-stack features that directly impact customers.",
    "In this role you'll collaborate with cross-functional teams to deliver performant, reliable software." 
  ],
  Finance: [
    "Join our finance team to build robust systems that process and analyze financial data at scale.",
    "You will ensure high standards of data accuracy and compliance while improving performance." 
  ],
  Healthcare: [
    "Help us deliver healthcare solutions that improve patient outcomes and provider workflows.",
    "You will work on compliant, secure systems that prioritize data privacy and reliability." 
  ]
};

const cultureBenefits: Record<string, string[]> = {
  Startup: [
    'Equity or stock options',
    'Flexible hours and fast-moving environment',
    'Direct impact on product direction'
  ],
  Corporate: [
    'Comprehensive health benefits',
    'Structured career progression',
    'Large-scale, stable projects'
  ],
  'Remote-first': [
    'Fully remote work with flexible scheduling',
    'Home office stipend',
    'Asynchronous collaboration and distributed teams'
  ]
};

export function generateJobDescription(input: TemplateInput, variation = 0) {
  const company = input.company || 'Your Company';
  const industry = input.industry || 'Tech';
  const experience = input.experience || 'Mid';

  // About the role - pick paragraph(s) with simple variation
  const industryArr = industryTemplates[industry] || industryTemplates['Tech'];
  const industryPara = industryArr[variation % industryArr.length] || industryArr[0];
  const industryPara2 = industryArr[(variation + 1) % industryArr.length] || '';

  // Responsibilities: pick from skills mapping plus generic responsibilities
  let responsibilities: string[] = [];
  input.skills.forEach((s) => {
    const mapped = (skillResponsibilities as any)[s];
    if (mapped) responsibilities = responsibilities.concat(mapped);
    else responsibilities.push(`Work on ${s} related tasks and implementations.`);
  });
  // Add some generic responsibilities based on experience
  const genericByExp: Record<string, string[]> = {
    Entry: [
      'Contribute to feature development under guidance from senior engineers.',
      'Write tests and assist in debugging issues.'
    ],
    Mid: [
      'Own medium-sized features end-to-end from design to deployment.',
      'Collaborate with stakeholders to define priorities.'
    ],
    Senior: [
      'Lead technical design and mentor junior engineers.',
      'Drive architecture decisions and deliver scalable solutions.'
    ]
  };

  responsibilities = responsibilities.concat(genericByExp[experience] || genericByExp['Mid']);
  // simple variation: reverse order for variation > 0
  if (variation > 0) responsibilities = responsibilities.reverse();
  // keep 5-7 bullets
  responsibilities = responsibilities.slice(0, 7);

  // Required and preferred skills
  const requiredSkills = input.skills.slice(0, 6);
  const preferredSkills = input.skills.slice(6);

  // Experience text
  const experienceText = experience === 'Entry' ? '0-2 years of relevant experience.' : experience === 'Mid' ? '2-5 years of relevant experience.' : '5+ years of relevant experience.';

  // Benefits
  let benefits = (cultureBenefits as any)[input.culture || 'Startup'].slice(0, 5);
  if (variation === 1) benefits = benefits.reverse();

  // Build description object
  const titleLine = `${input.jobTitle} at ${company}`;
  const aboutRole = `${industryPara} ${industryPara2}`;

  const descriptionText = {
    title: titleLine,
    about: aboutRole,
    responsibilities,
    requiredSkills,
    preferredSkills,
    experience: experienceText,
    benefits,
    aboutCompany: `At ${company}, we focus on building products that matter.`,
    specialRequirements: input.specialRequirements || ''
  };

  return descriptionText;
}

export default {
  generateJobDescription,
  skillResponsibilities,
  industryTemplates,
  cultureBenefits
};
