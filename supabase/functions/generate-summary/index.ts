import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { fullName, skills, workExperience, education } = await req.json();
    const summary = generateSummary(fullName, skills, workExperience, education);

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to generate summary" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateSummary(
  fullName: string,
  skills: string[],
  workExperience: any[],
  education: any[]
): string {
  const name = fullName?.trim() || "";
  const allSkills = (skills || []).map((s: string) => s.trim()).filter(Boolean);
  const exp = workExperience || [];
  const edu = education || [];

  const latestJob = exp[0] || null;
  const secondJob = exp[1] || null;
  const latestEdu = edu[0] || null;

  const yearsExp = calcYears(exp);
  const totalRoles = exp.length;
  const hasMultipleRoles = totalRoles > 1;

  const roleType = detectRoleType(allSkills, exp);
  const opening = pickOpening(name, latestJob, allSkills, yearsExp, roleType);
  const body = buildBody(latestJob, secondJob, allSkills, yearsExp, hasMultipleRoles, roleType);
  const closing = buildClosing(latestEdu, allSkills, roleType, latestJob, totalRoles);

  const lines = [opening, body, closing].filter(Boolean);
  return lines.join(" ");
}

function detectRoleType(skills: string[], exp: any[]): string {
  const skillLower = new Set(skills.map(s => s.toLowerCase()));
  const positions = exp.map(e => (e.position || "").toLowerCase());
  const posStr = positions.join(" ");
  const skillStr = [...skillLower].join(" ");

  if (positions.some(p => /manage|director|lead|head|vp|chief|principal|senior/.test(p)) ||
      skillLower.has("project management") || skillLower.has("leadership") || skillLower.has("strategy")) {
    return "leadership";
  }
  if (/engineer|developer|programmer|devops|architect|backend|frontend|fullstack|full-stack/.test(posStr) ||
      skillLower.has("javascript") || skillLower.has("python") || skillLower.has("react") ||
      skillLower.has("java") || skillLower.has("typescript") || skillLower.has("node") ||
      skillLower.has("aws") || skillLower.has("docker") || skillLower.has("kubernetes") ||
      skillLower.has("c++") || skillLower.has("c#") || skillLower.has(".net") ||
      skillLower.has("go") || skillLower.has("rust")) {
    return "tech";
  }
  if (/design|ux|ui|creative|graphic|illustrator/.test(posStr) ||
      skillLower.has("figma") || skillLower.has("ui/ux") || skillLower.has("adobe") ||
      skillLower.has("sketch") || skillLower.has("photoshop")) {
    return "design";
  }
  if (/analyst|data|scientist|machine learn|ai|ml/.test(posStr) ||
      skillLower.has("sql") || skillLower.has("python") || skillLower.has("r") ||
      skillLower.has("tableau") || skillLower.has("power bi") || skillLower.has("pandas") ||
      skillLower.has("tensorflow") || skillLower.has("spark") || skillLower.has("analytics")) {
    return "data";
  }
  if (/market|seo|content|copywrit|brand|social media|communi/.test(posStr) ||
      skillLower.has("marketing") || skillLower.has("seo") || skillLower.has("content strategy")) {
    return "marketing";
  }
  if (/sale|account executive|business develop|bdm|revenue/.test(posStr) ||
      skillLower.has("salesforce") || skillLower.has("crm") || skillLower.has("negotiation")) {
    return "sales";
  }
  if (/financ|account|audit|bank|invest/.test(posStr) ||
      skillLower.has("financial analysis") || skillLower.has("accounting") || skillLower.has("excel")) {
    return "finance";
  }
  if (/nurs|doctor|health|medical|pharma|clinic|therap/.test(posStr)) {
    return "healthcare";
  }
  if (/teach|professor|instructor|educat|tutor|academ/.test(posStr)) {
    return "education";
  }
  return "general";
}

function pickOpening(name: string, job: any, skills: string[], years: string, roleType: string): string {
  const pos = job?.position?.trim();
  const company = job?.company?.trim();
  const topSkills = skills.slice(0, 3);

  // With name
  if (name) {
    if (pos && company && years) {
      return `${name} — ${pos} at ${company} with ${years} of experience delivering ${domainOutcomes(roleType)}.`;
    }
    if (pos && years) {
      return `${name} — ${pos} with ${years} of experience delivering ${domainOutcomes(roleType)}.`;
    }
    if (pos && company) {
      return `${name} — ${pos} at ${company}, specializing in ${domainFocus(roleType)}.`;
    }
    if (pos) {
      return `${name} — ${pos} focused on delivering ${domainOutcomes(roleType)}.`;
    }
    if (topSkills.length >= 2) {
      return `${name} — ${roleLabel(roleType)} with demonstrated expertise in ${topSkills.slice(0, 2).join(" and ")}.`;
    }
    if (topSkills.length === 1) {
      return `${name} — ${roleLabel(roleType)} with hands-on expertise in ${topSkills[0]}.`;
    }
    return `${name} — ${roleLabel(roleType)} with a track record of ${domainOutcomes(roleType)}.`;
  }

  // Without name
  if (pos && years) {
    return `${pos} with ${years} of experience delivering ${domainOutcomes(roleType)}.`;
  }
  if (pos) {
    return `Results-driven ${pos} specializing in ${domainFocus(roleType)}.`;
  }
  if (topSkills.length >= 2) {
    return `${roleLabel(roleType)} with demonstrated expertise in ${topSkills.slice(0, 2).join(" and ")}.`;
  }
  return `${roleLabel(roleType)} with a track record of ${domainOutcomes(roleType)}.`;
}

function buildBody(
  job: any, secondJob: any, skills: string[], years: string,
  hasMultipleRoles: boolean, roleType: string
): string {
  const parts: string[] = [];
  const pos = job?.position?.trim();
  const company = job?.company?.trim();
  const desc = job?.description?.trim();
  const secondPos = secondJob?.position?.trim();
  const secondCompany = secondJob?.company?.trim();
  const topSkills = skills.slice(0, 5);

  // Experience breadth
  if (hasMultipleRoles && secondPos) {
    const secondRef = secondCompany ? ` at ${secondCompany}` : "";
    parts.push(`Background spans ${pos}${company ? ` at ${company}` : ""} through ${secondPos}${secondRef}`);
  } else if (company && pos) {
    parts.push(`Currently driving impact at ${company} as ${pos}`);
  }

  // Skill highlights integrated with context
  if (topSkills.length >= 3) {
    const skillPhrase = `${topSkills[0]}, ${topSkills[1]}, and ${topSkills[2]}`;
    parts.push(`core strengths include ${skillPhrase}`);
  } else if (topSkills.length === 2) {
    parts.push(`leverages ${topSkills[0]} and ${topSkills[1]} to ${domainVerb(roleType)}`);
  } else if (topSkills.length === 1) {
    parts.push(`applies ${topSkills[0]} to ${domainVerb(roleType)}`);
  }

  // Achievements from description
  if (desc) {
    const lines = desc.split("\n").map(l => l.replace(/^[•\-\*]\s*/, "").trim()).filter(Boolean);
    if (lines.length > 0) {
      const highlight = lines[0].replace(/^(I |we |my )/i, "").trim();
      if (highlight.length > 10 && highlight.length < 100) {
        const cleaned = highlight.endsWith(".") ? highlight : highlight + "";
        parts.push(`notably ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}`);
      }
    }
  }

  if (parts.length === 0) return "";
  return parts.join("; ") + ".";
}

function buildClosing(edu: any, skills: string[], roleType: string, job: any, totalRoles: number): string {
  const parts: string[] = [];
  const degree = edu?.degree?.trim();
  const field = edu?.field?.trim();
  const institution = edu?.institution?.trim();

  if (degree && field && institution) {
    parts.push(`Holds a ${degree} in ${field} from ${institution}`);
  } else if (degree && field) {
    parts.push(`Holds a ${degree} in ${field}`);
  } else if (degree && institution) {
    parts.push(`Holds a ${degree} from ${institution}`);
  } else if (degree) {
    parts.push(`${degree} graduate`);
  }

  // Closing value statement (varied, role-specific)
  if (!job && skills.length === 0) {
    parts.push("eager to contribute to a dynamic team and grow professionally");
  } else if (totalRoles <= 1 && !degree) {
    parts.push(`brings fresh perspective and ${domainFocus(roleType)} capabilities ready for the next challenge`);
  } else {
    // Different closings by role type to avoid repetition
    const closings: Record<string, string[]> = {
      leadership: [
        "focused on building high-performing teams and aligning strategy with execution",
        "known for translating complex objectives into actionable plans that move metrics",
        "skilled at aligning cross-functional efforts around shared goals and measurable outcomes",
      ],
     tech: [
  "focused on shipping reliable, maintainable systems at scale",
  "experienced in turning requirements into production-ready solutions under tight timelines",
  "known for writing clean, well-tested code and mentoring teammates on best practices",
  "strong understanding of software engineering principles and design patterns",
  "proficient in developing responsive web and mobile applications",
  "experienced with modern JavaScript and TypeScript development",
  "skilled in building scalable React and React Native applications",
  "comfortable working with RESTful APIs and third-party integrations",
  "knowledgeable in backend development using Node.js and Express",
  "experienced with SQL and NoSQL database design and optimization",
  "familiar with cloud platforms and serverless architectures",
  "adept at debugging complex software issues and optimizing application performance",
  "passionate about writing reusable, modular, and maintainable code",
  "experienced with version control using Git and collaborative development workflows",
  "strong understanding of Agile and Scrum development methodologies",
  "able to quickly learn new technologies and adapt to changing project requirements",
  "committed to continuous improvement through code reviews and testing",
  "experienced in implementing secure authentication and authorization systems",
  "knowledgeable in CI/CD practices and automated deployment pipelines",
  "focused on delivering intuitive and user-friendly software experiences",
  "strong problem-solving and analytical thinking skills",
  "experienced in integrating AI-powered features into modern applications",
  "able to communicate technical concepts clearly with technical and non-technical stakeholders",
  "skilled at translating business requirements into practical software solutions",
  "experienced in performance tuning and application monitoring",
  "knowledgeable in software architecture and system scalability",
  "dedicated to producing high-quality software with attention to detail",
  "experienced in developing cross-platform applications using Expo",
  "comfortable working independently as well as within collaborative development teams",
  "committed to delivering projects on schedule while maintaining high coding standards",
  "experienced in creating accessible and inclusive user interfaces",
  "knowledgeable in mobile application publishing and deployment processes",
  "proficient in testing applications using unit and integration testing methodologies",
  "experienced with modern frontend styling frameworks and UI component libraries",
  "passionate about leveraging AI and automation to improve productivity and user experience",
],
      design: [
        "dedicated to crafting interfaces that balance user needs with business objectives",
        "experienced in running end-to-end design processes from research through handoff",
        "known for translating complex workflows into intuitive, accessible experiences",
      ],
      data: [
        "focused on turning messy datasets into clear, decision-driving insights",
        "experienced in building reproducible pipelines from ingestion through visualization",
        "known for identifying the metric that matters and building dashboards around it",
      ],
      marketing: [
        "focused on growing acquisition channels while maintaining brand integrity",
        "experienced in building content strategies that drive organic reach and engagement",
        "known for aligning campaign creative with measurable conversion goals",
      ],
      sales: [
        "focused on building pipeline through strategic outreach and consultative selling",
        "experienced in managing full-cycle deals from prospecting through close",
        "known for consistently exceeding quota in competitive markets",
      ],
      finance: [
        "focused on ensuring accuracy and compliance while identifying cost-saving opportunities",
        "experienced in financial modeling, forecasting, and stakeholder reporting",
        "known for translating financial data into clear recommendations for leadership",
      ],
     healthcare: [
  "committed to evidence-based practice and patient-centered care standards",
  "experienced in coordinating across care teams to improve outcomes",
  "known for maintaining calm, thorough documentation under pressure",
  "dedicated to delivering compassionate, high-quality patient care",
  "experienced in monitoring patient progress and reporting changes promptly",
  "strong understanding of patient confidentiality and healthcare ethics",
  "proficient in maintaining accurate medical records and documentation",
  "committed to infection prevention and strict safety protocols",
  "experienced in collaborating with multidisciplinary healthcare teams",
  "skilled at building trust and rapport with patients and their families",
  "able to prioritize patient needs in fast-paced clinical environments",
  "knowledgeable in medication administration and dosage verification",
  "experienced in supporting physicians and nursing staff during procedures",
  "focused on promoting patient comfort, dignity, and well-being",
  "strong communication skills when interacting with patients and healthcare professionals",
  "experienced in handling medical emergencies with professionalism and composure",
  "committed to continuous professional development and lifelong learning",
  "knowledgeable in healthcare regulations, policies, and compliance standards",
  "experienced in providing health education and patient counseling",
  "skilled in observing, assessing, and documenting patient conditions accurately",
  "proficient in using electronic health record (EHR) systems",
  "experienced in scheduling, coordinating, and managing patient appointments",
  "dedicated to improving patient satisfaction through compassionate service",
  "strong organizational and time-management skills in busy healthcare settings",
  "experienced in maintaining sterile environments and following infection control procedures",
  "knowledgeable in first aid, CPR, and emergency response procedures",
  "able to work effectively during long shifts while maintaining attention to detail",
  "committed to respecting cultural diversity and providing inclusive patient care",
  "experienced in supporting rehabilitation and recovery programs",
  "focused on delivering safe, efficient, and evidence-based healthcare services",
  "capable of working independently while contributing effectively to multidisciplinary teams",
  "experienced in assisting with patient assessments and routine clinical procedures",
  "dedicated to improving healthcare quality through continuous evaluation and best practices",
  "strong problem-solving abilities when addressing patient care challenges",
  "committed to maintaining professionalism, empathy, and integrity in every patient interaction",
],
      education: [
        "dedicated to creating learning experiences that build lasting competence and confidence",
        "experienced in curriculum design and differentiated instruction across diverse cohorts",
        "known for combining subject expertise with approachable, student-first methodology",
      ],
      general: [
        "brings structure, initiative, and follow-through to every project",
        "known for cross-functional collaboration and consistent delivery under deadlines",
        "combines analytical thinking with clear communication to move projects forward",
      ],
    };
    const options = closings[roleType] || closings.general;
    parts.push(options[Math.floor(Math.random() * options.length)]);
  }

  return parts.join("; ") + ".";
}

function domainOutcomes(type: string): string {
  const map: Record<string, string> = {
    leadership: "measurable business outcomes",
    tech: "production-grade solutions",
    design: "user-centered products",
    data: "data-informed decisions",
    marketing: "audience growth and engagement",
    sales: "revenue and strategic partnerships",
    finance: "financial accuracy and compliance",
    healthcare: "quality patient outcomes",
    education: "effective learning outcomes",
    general: "tangible results",
  };
  return map[type] || map.general;
}

function domainFocus(type: string): string {
  const map: Record<string, string> = {
    leadership: "team alignment and strategic execution",
    tech: "scalable system design and delivery",
    design: "end-to-end product design",
    data: "analytical rigor and reproducible insights",
    marketing: "brand growth and audience development",
    sales: "pipeline development and deal closure",
    finance: "financial analysis and reporting accuracy",
    healthcare: "clinical excellence and evidence-based care",
    education: "curriculum innovation and learner success",
    general: "cross-functional problem-solving",
  };
  return map[type] || map.general;
}

function domainVerb(type: string): string {
  const map: Record<string, string> = {
    leadership: "drive strategic alignment across teams",
    tech: "ship reliable, maintainable systems",
    design: "create intuitive, accessible user flows",
    data: "surface actionable insights from complex data",
    marketing: "grow reach and convert audiences",
    sales: "close deals and expand strategic accounts",
    finance: "ensure accuracy and surface cost efficiencies",
    healthcare: "improve clinical workflows and patient outcomes",
    education: "design curricula that build lasting competence",
    general: "solve problems and ship on time",
  };
  return map[type] || map.general;
}

function roleLabel(type: string): string {
  const map: Record<string, string> = {
    leadership: "Strategic leader",
    tech: "Technical professional",
    design: "Product designer",
    data: "Data-driven professional",
    marketing: "Marketing specialist",
    sales: "Business development professional",
    finance: "Finance professional",
    healthcare: "Healthcare professional",
    education: "Education professional",
    general: "Versatile professional",
  };
  return map[type] || map.general;
}

function calcYears(experience: any[]): string {
  if (!experience.length) return "";
  const currentYear = new Date().getFullYear();

  const years = experience
    .map((e) => {
      const startParts = (e.start_date || "").trim().split(/\s+/);
      const endParts = (e.end_date || "").trim().split(/\s+/);
      const startYear = parseInt(startParts[startParts.length - 1]) || currentYear - 2;
      const endYear = e.current ? currentYear : parseInt(endParts[endParts.length - 1]) || startYear + 2;
      return Math.max(0, endYear - startYear);
    })
    .reduce((a, b) => a + b, 0);

  if (years >= 8) return `${years}+ years`;
  if (years >= 1) return `${years} year${years > 1 ? "s" : ""}`;
  return "under a year";
}
