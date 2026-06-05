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
    const { summary, skills, education, workExperience, jobDescription } = await req.json();

    if (!jobDescription || !jobDescription.trim()) {
      return new Response(JSON.stringify({ error: "Job description is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = analyzeJobMatch(summary, skills, education, workExperience, jobDescription);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to analyze job match" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

interface MatchResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  keywordsFromJob: string[];
  cvStrengthsForJob: string[];
  recommendations: string[];
}

function analyzeJobMatch(
  summary: string,
  skills: string[],
  education: any[],
  workExperience: any[],
  jobDescription: string
): MatchResult {
  const cvSkills = (skills || []).map((s: string) => s.trim().toLowerCase()).filter(Boolean);
  const cvSummary = (summary || "").toLowerCase();
  const cvEdu = education || [];
  const cvExp = workExperience || [];
  const jdLower = jobDescription.toLowerCase();

  // 1. Extract keywords and requirements from job description
  const jobKeywords = extractJobKeywords(jdLower);
  const jobRequirements = extractJobRequirements(jdLower);

  // 2. Find matched skills (exact + near)
  const matched: string[] = [];
  const missing: string[] = [];

  for (const kw of jobKeywords) {
    if (isSkillMatch(kw, cvSkills, cvSummary)) {
      matched.push(kw);
    } else if (isNearMatch(kw, cvSkills, cvSummary, cvExp)) {
      matched.push(kw);
    } else {
      // Check if it's a truly required skill (not a soft skill)
      if (isHardSkill(kw)) {
        missing.push(kw);
      }
    }
  }

  // 3. Calculate match score
  const score = calculateScore(matched, missing, jobKeywords, jobRequirements, cvSkills, cvExp, cvEdu, cvSummary, jdLower);

  // 4. Identify CV strengths relevant to this job
  const strengths = identifyStrengths(cvSkills, cvExp, cvEdu, cvSummary, jdLower);

  // 5. Generate recommendations
  const recs = generateRecommendations(missing, cvSkills, cvExp, cvEdu, cvSummary, jdLower);

  return {
    matchScore: Math.min(100, Math.max(0, Math.round(score))),
    matchedSkills: matched,
    missingSkills: missing,
    keywordsFromJob: jobKeywords,
    cvStrengthsForJob: strengths,
    recommendations: recs,
  };
}

function extractJobKeywords(jd: string): string[] {
  const keywords = new Set<string>();

  // Known technical skills to look for
  const techPatterns = [
    /\b(javascript|typescript|js|ts)\b/gi,
    /\b(python|java|c\+\+|c#|csharp|ruby|go|golang|rust|swift|kotlin|php|scala|r|matlab)\b/gi,
    /\b(react|angular|vue|svelte|next\.?js|nuxt)\b/gi,
    /\b(node\.?js|express|django|flask|spring|rails|laravel|fastapi|\.net)\b/gi,
    /\b(aws|azure|gcp|google cloud)\b/gi,
    /\b(docker|kubernetes|k8s|terraform|ansible|jenkins|ci\/cd|github actions)\b/gi,
    /\b(sql|mysql|postgresql|postgres|mongodb|redis|dynamodb|elasticsearch|firebase|supabase)\b/gi,
    /\b(git|github|gitlab|bitbucket|jira|confluence)\b/gi,
    /\b(figma|sketch|adobe xd|photoshop|illustrator|invision)\b/gi,
    /\b(html|css|sass|scss|tailwind|bootstrap|material ui)\b/gi,
    /\b(rest|api|graphql|grpc|websocket|microservices)\b/gi,
    /\b(agile|scrum|kanban|lean|waterfall)\b/gi,
    /\b(mobile|ios|android|react native|flutter|expo)\b/gi,
    /\b(machine learning|ml|ai|deep learning|tensorflow|pytorch|nlp|computer vision)\b/gi,
    /\b(data analysis|data science|pandas|numpy|tableau|power bi|excel|analytics)\b/gi,
    /\b(testing|jest|mocha|cypress|selenium|unit test|e2e|qa)\b/gi,
    /\b(security|oauth|jwt|encryption|penetration testing|owasp)\b/gi,
    /\b(salesforce|hubspot|sap|oracle|servicenow|workday)\b/gi,
    /\b(project management|pmp|prince2|jira|asana|trello)\b/gi,
    /\b(communication|leadership|teamwork|problem.solving|critical thinking)\b/gi,
    /\b(marketing|seo|sem|google analytics|content strategy|social media)\b/gi,
    /\b(sales|negotiation|crm|account management|business development)\b/gi,
    /\b(finance|accounting|financial analysis|auditing|bookkeeping)\b/gi,
    /\b(photoshop|illustrator|premiere|after effects)\b/gi,
    /\b(office|microsoft office|word|excel|powerpoint|sharepoint)\b/gi,
  ];

  for (const pattern of techPatterns) {
    const matches = jd.match(pattern);
    if (matches) {
      matches.forEach((m) => keywords.add(m.toLowerCase().trim()));
    }
  }

  // Extract words from "requirements" / "qualifications" sections
  const reqSection = jd.match(/(?:requirements|qualifications|must have|nice to have|preferred|required|you (?:should|will|need|must))[:\s]+([\s\S]*?)(?:(?:responsibilities|duties|about|we offer|benefits|what you|who you|$))/i);
  if (reqSection) {
    const reqText = reqSection[1];
    // Extract meaningful multi-word phrases
    const phrases = reqText.match(/\b[a-z][a-z\s+\-.#]+\b/gi);
    if (phrases) {
      phrases.forEach(p => {
        const trimmed = p.trim().toLowerCase();
        if (trimmed.length >= 2 && trimmed.length <= 40) {
          keywords.add(trimmed);
        }
      });
    }
  }

  return [...keywords];
}

function extractJobRequirements(jd: string): { hard: string[]; soft: string[]; experience: string } {
  // Simple extraction of requirement types
  const softPatterns = [
    /\b(communicat|leadership|teamwork|collaborat|problem.solv|critical.think|adapt|self.start|detail.orient|organiz|time.manag|proactiv|creativ)\w*\b/gi,
  ];

  const soft = new Set<string>();
  for (const p of softPatterns) {
    const m = jd.match(p);
    if (m) m.forEach(s => soft.add(s.toLowerCase().trim()));
  }

  // Experience requirement
  const expMatch = jd.match(/(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)/i);
  const experience = expMatch ? expMatch[1] : "";

  return { hard: [], soft: [...soft], experience };
}

function isSkillMatch(keyword: string, cvSkills: string[], cvSummary: string): boolean {
  const kw = keyword.toLowerCase();
  // Exact match in CV skills
  if (cvSkills.some(s => s === kw || s === keyword)) return true;
  // Normalized match (removing dots, spaces, hyphens)
  const kwNorm = kw.replace(/[\s.\-+#]/g, "");
  if (cvSkills.some(s => s.replace(/[\s.\-+#]/g, "") === kwNorm)) return true;
  // In summary text
  if (cvSummary.includes(kw)) return true;
  return false;
}

function isNearMatch(keyword: string, cvSkills: string[], cvSummary: string, cvExp: any[]): boolean {
  const kw = keyword.toLowerCase();

  // Common near-match mappings
  const nearMatches: Record<string, string[]> = {
    "js": ["javascript"],
    "javascript": ["js", "typescript", "ts"],
    "typescript": ["ts", "javascript"],
    "python": ["django", "flask", "fastapi"],
    "react": ["react native", "next.js", "nextjs"],
    "node.js": ["nodejs", "express", "node"],
    "nodejs": ["node.js", "express"],
    "aws": ["amazon web services", "cloud"],
    "azure": ["microsoft azure", "cloud"],
    "gcp": ["google cloud", "google cloud platform"],
    "kubernetes": ["k8s", "docker"],
    "docker": ["kubernetes", "containerization"],
    "sql": ["mysql", "postgresql", "postgres", "sqlite"],
    "postgresql": ["postgres", "sql", "database"],
    "mongodb": ["nosql", "database"],
    "html": ["css", "web"],
    "css": ["html", "sass", "scss", "tailwind"],
    "rest": ["api", "http"],
    "graphql": ["api", "rest"],
    "mobile": ["ios", "android", "react native", "flutter"],
    "ios": ["mobile", "swift", "apple"],
    "android": ["mobile", "kotlin", "java"],
    "figma": ["design", "ui/ux"],
    "machine learning": ["ml", "ai", "data science", "python"],
    "data analysis": ["analytics", "data science", "sql", "python"],
  };

  const nearList = nearMatches[kw];
  if (nearList) {
    if (cvSkills.some(s => nearList.includes(s))) return true;
    if (nearList.some(n => cvSummary.includes(n))) return true;
  }

  // Check experience descriptions
  for (const exp of cvExp) {
    const desc = (exp.description || "").toLowerCase();
    const pos = (exp.position || "").toLowerCase();
    if (desc.includes(kw) || pos.includes(kw)) return true;
  }

  return false;
}

function isHardSkill(keyword: string): boolean {
  const kw = keyword.toLowerCase().trim();

  // Soft/irrelevant terms to skip
  const softTerms = [
    "communication", "leadership", "teamwork", "team player", "problem solving",
    "critical thinking", "attention to detail", "detail oriented", "self starter",
    "proactive", "organized", "time management", "adaptability", "flexibility",
    "creativ", "collaborat", "passion", "enthusias", "motivat", "driver",
    "strong", "excellent", "good", "great", "ability", "willing", "able to",
    "experience", "years", "knowledge", "understanding", "familiar", "proficien",
    "work", "working", "environment", "fast paced", "dynamic", "hands on",
  ];

  if (softTerms.some(t => kw.includes(t))) return false;
  if (kw.length <= 2) return false;

  return true;
}

function calculateScore(
  matched: string[],
  missing: string[],
  jobKeywords: string[],
  jobReqs: { hard: string[]; soft: string[]; experience: string },
  cvSkills: string[],
  cvExp: any[],
  cvEdu: any[],
  cvSummary: string,
  jd: string
): number {
  let score = 0;

  // 1. Skill match scoring (0-50 points)
  const hardJobSkills = jobKeywords.filter(isHardSkill);
  if (hardJobSkills.length > 0) {
    const matchedHard = matched.filter(isHardSkill);
    score += (matchedHard.length / hardJobSkills.length) * 50;
  } else if (jobKeywords.length > 0) {
    score += (matched.length / jobKeywords.length) * 50;
  }

  // 2. Experience relevance (0-25 points)
  if (cvExp.length > 0) {
    let expRelevance = 0;
    for (const exp of cvExp) {
      const pos = (exp.position || "").toLowerCase();
      const desc = (exp.description || "").toLowerCase();
      const company = (exp.company || "").toLowerCase();
      const combined = `${pos} ${desc} ${company}`;

      // Check how many job keywords appear in this experience
      let matchCount = 0;
      for (const kw of jobKeywords) {
        if (combined.includes(kw)) matchCount++;
      }
      expRelevance = Math.max(expRelevance, Math.min(1, matchCount / Math.max(3, jobKeywords.length)));
    }
    score += expRelevance * 25;

    // Experience duration match
    if (jobReqs.experience) {
      const reqYears = parseInt(jobReqs.experience);
      const actualYears = estimateYears(cvExp);
      if (actualYears >= reqYears) {
        score += 5; // bonus for meeting experience requirement
      }
    }
  } else {
    score += 5; // small baseline
  }

  // 3. Education relevance (0-15 points)
  if (cvEdu.length > 0) {
    // Check if job mentions specific education requirements
    const eduKeywords = ["bachelor", "master", "phd", "degree", "diploma", "bsc", "msc", "mba", "b.s", "m.s", "b.a", "m.a"];
    const jdRequiresEdu = eduKeywords.some(k => jd.includes(k));

    if (jdRequiresEdu && cvEdu.length > 0) {
      // Has education when required
      for (const edu of cvEdu) {
        const field = (edu.field || "").toLowerCase();
        const degree = (edu.degree || "").toLowerCase();
        // Check if field is mentioned in JD
        const fieldInJd = field.split(/\s+/).some(word => word.length > 3 && jd.includes(word));
        if (fieldInJd) {
          score += 12;
          break;
        }
      }
      score += 3; // baseline for having any degree
    } else {
      score += 8;
    }
  }

  // 4. Summary alignment (0-10 points)
  if (cvSummary) {
    const summaryWords = new Set(cvSummary.split(/\s+/).filter(w => w.length > 3));
    const jdWords = new Set(jd.split(/\s+/).filter(w => w.length > 3));
    let overlap = 0;
    for (const word of summaryWords) {
      if (jdWords.has(word)) overlap++;
    }
    const overlapRatio = overlap / Math.max(1, summaryWords.size);
    score += overlapRatio * 10;
  }

  return score;
}

function estimateYears(experience: any[]): number {
  const currentYear = new Date().getFullYear();
  return experience
    .map((e) => {
      const startParts = (e.start_date || "").trim().split(/\s+/);
      const endParts = (e.end_date || "").trim().split(/\s+/);
      const startYear = parseInt(startParts[startParts.length - 1]) || currentYear - 2;
      const endYear = e.current ? currentYear : parseInt(endParts[endParts.length - 1]) || startYear + 2;
      return Math.max(0, endYear - startYear);
    })
    .reduce((a, b) => a + b, 0);
}

function identifyStrengths(
  cvSkills: string[],
  cvExp: any[],
  cvEdu: any[],
  cvSummary: string,
  jd: string
): string[] {
  const strengths: string[] = [];

  // Skills that directly match job keywords
  const directlyMatched = cvSkills.filter(s => jd.includes(s.toLowerCase()));
  if (directlyMatched.length >= 3) {
    strengths.push(`${directlyMatched.length} skills directly match job requirements (${directlyMatched.slice(0, 5).join(", ")})`);
  } else if (directlyMatched.length > 0) {
    strengths.push(`Skills directly match: ${directlyMatched.join(", ")}`);
  }

  // Experience relevance
  for (const exp of cvExp) {
    const pos = (exp.position || "").toLowerCase();
    const desc = (exp.description || "").toLowerCase();
    const combined = `${pos} ${desc}`;

    let matchCount = 0;
    const jdWords = jd.split(/\s+/);
    for (const w of jdWords) {
      if (w.length > 3 && combined.includes(w.toLowerCase())) matchCount++;
    }

    if (matchCount >= 4) {
      const title = exp.position || exp.company || "Previous role";
      strengths.push(`${title} has strong alignment with this position`);
      if (strengths.length >= 2) break;
    }
  }

  // Education strength
  for (const edu of cvEdu) {
    const field = (edu.field || "").toLowerCase();
    const degree = (edu.degree || "").toLowerCase();
    if (field && jd.includes(field)) {
      strengths.push(`${degree} in ${field} directly relevant to role`);
      break;
    }
  }

  // Experience duration
  const totalYears = estimateYears(cvExp);
  if (totalYears >= 5) {
    strengths.push(`${totalYears}+ years of professional experience`);
  } else if (totalYears >= 2) {
    strengths.push(`${totalYears} years of relevant experience`);
  }

  // Ensure at least 1 strength
  if (strengths.length === 0) {
    if (cvSkills.length > 0) {
      strengths.push(`${cvSkills.length} professional skills listed`);
    } else if (cvExp.length > 0) {
      strengths.push("Has professional work experience");
    } else {
      strengths.push("Available and ready for new opportunities");
    }
  }

  return strengths.slice(0, 5);
}

function generateRecommendations(
  missing: string[],
  cvSkills: string[],
  cvExp: any[],
  cvEdu: any[],
  cvSummary: string,
  jd: string
): string[] {
  const recs: string[] = [];

  // Missing skills recommendations (most impactful)
  const topMissing = missing.slice(0, 3);
  for (const skill of topMissing) {
    // Check if it's a tool/framework or a domain
    const tools = ["aws", "azure", "gcp", "docker", "kubernetes", "figma", "jira",
      "salesforce", "tableau", "power bi", "git", "jenkins", "terraform"];
    const frameworks = ["react", "angular", "vue", "django", "flask", "spring",
      "express", "next.js", "nuxt", "flutter", "swift", "kotlin"];

    if (tools.some(t => skill.includes(t))) {
      recs.push(`Add ${skill} experience — consider a personal project or certification to demonstrate proficiency`);
    } else if (frameworks.some(f => skill.includes(f))) {
      recs.push(`Add ${skill} project experience — build a sample project or contribute to an open-source ${skill} codebase`);
    } else {
      recs.push(`Add ${skill} to your skills and demonstrate experience with it in your work history`);
    }
  }

  // Summary optimization
  const summaryWords = new Set((cvSummary || "").split(/\s+/).filter(w => w.length > 3));
  let overlap = 0;
  for (const word of summaryWords) {
    if (jd.includes(word.toLowerCase())) overlap++;
  }
  if (overlap < 3 || !cvSummary) {
    const jdKeyPhrases = extractTopKeywords(jd, 3);
    recs.push(`Rewrite your summary to include these job keywords: ${jdKeyPhrases.join(", ")}`);
  }

  // Experience recommendations
  if (cvExp.length === 0) {
    recs.push("Add work experience — even internships, freelance work, or academic projects strengthen your application");
  } else {
    // Check if experience descriptions mention job-relevant keywords
    for (const exp of cvExp) {
      const desc = (exp.description || "").toLowerCase();
      let descOverlap = 0;
      for (const kw of missing.slice(0, 5)) {
        if (desc.includes(kw)) descOverlap++;
      }
      // If descriptions are empty
      if (!desc.trim()) {
        recs.push(`Add achievement-focused description to your ${exp.position || exp.company || "work experience"} entry`);
        break;
      }
    }
  }

  // Education relevance
  if (cvEdu.length === 0) {
    const jdEduMentioned = /degree|bachelor|master|diploma|education/i.test(jd);
    if (jdEduMentioned) {
      recs.push("This job requires education — add your degree and field of study");
    }
  }

  // Ensure 3-5 recommendations
  if (recs.length < 3) {
    if (missing.length > 3) {
      recs.push(`Consider gaining experience with: ${missing.slice(3, 6).join(", ")}`);
    }
  }

  return recs.slice(0, 5);
}

function extractTopKeywords(jd: string, count: number): string[] {
  const stopWords = new Set([
    "the", "and", "for", "with", "that", "this", "will", "are", "our", "you",
    "your", "have", "from", "been", "they", "their", "which", "would", "about",
    "should", "other", "into", "also", "more", "such", "than", "them", "then",
    "what", "when", "where", "how", "each", "does", "only", "but", "not",
    "very", "just", "over", "most", "work", "role", "team", "help", "need",
    "ability", "using", "within", "well", "including", "ensure", "across",
    "looking", "join", "about", "must", "able", "required", "preferred",
  ]);

  const words = jd.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([w]) => w);
}
