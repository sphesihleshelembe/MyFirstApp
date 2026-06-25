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

  // 2. Find matched skills (exact + near + context)
  const matched: string[] = [];
  const missing: string[] = [];

  for (const kw of jobKeywords) {
    if (isSkillMatch(kw, cvSkills, cvSummary, cvExp)) {
      matched.push(kw);
    } else if (isNearMatch(kw, cvSkills, cvSummary, cvExp)) {
      matched.push(kw);
    } else if (isHardSkill(kw)) {
      missing.push(kw);
    }
  }

  // 3. Calculate match score with improved algorithm
  const score = calculateScore(matched, missing, jobKeywords, cvSkills, cvExp, cvEdu, cvSummary, jdLower);

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
    /\b(project management|pmp|prince2|asana|trello)\b/gi,
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

  // Also extract significant words from requirements section
  const reqSection = jd.match(/(?:requirements|qualifications|must have|nice to have|preferred|required|you (?:should|will|need|must))[:\s]+([\s\S]*?)(?:(?:responsibilities|duties|about|we offer|benefits|what you|who you|$))/i);
  if (reqSection) {
    const reqText = reqSection[1];
    const phrases = reqText.match(/\b[a-z][a-z\s+\-.#]+\b/gi);
    if (phrases) {
      phrases.forEach(p => {
        const trimmed = p.trim().toLowerCase();
        if (trimmed.length >= 3 && trimmed.length <= 30 && !isSoftTerm(trimmed)) {
          keywords.add(trimmed);
        }
      });
    }
  }

  return [...keywords];
}

function isSoftTerm(term: string): boolean {
  const softTerms = [
    "communication", "leadership", "teamwork", "team player", "problem solving",
    "critical thinking", "attention to detail", "detail oriented", "self starter",
    "proactive", "organized", "time management", "adaptability", "flexibility",
    "creativ", "collaborat", "passion", "enthusias", "motivat", "driver",
    "strong", "excellent", "good", "great", "ability", "willing", "able to",
    "experience", "years", "knowledge", "understanding", "familiar", "proficien",
    "work", "working", "environment", "fast paced", "dynamic", "hands on",
  ];
  return softTerms.some(t => term.includes(t));
}

function isSkillMatch(keyword: string, cvSkills: string[], cvSummary: string, cvExp: any[]): boolean {
  const kw = keyword.toLowerCase();
  // Exact match in CV skills
  if (cvSkills.some(s => s === kw || s === keyword)) return true;
  // Normalized match (removing dots, spaces, hyphens)
  const kwNorm = kw.replace(/[\s.\-+#]/g, "");
  if (cvSkills.some(s => s.replace(/[\s.\-+#]/g, "") === kwNorm)) return true;
  // In summary text
  if (cvSummary.includes(kw)) return true;
  // Check work experience
  for (const exp of cvExp) {
    const desc = (exp.description || "").toLowerCase();
    const pos = (exp.position || "").toLowerCase();
    if (desc.includes(kw) || pos.includes(kw)) return true;
  }
  return false;
}

function isNearMatch(keyword: string, cvSkills: string[], cvSummary: string, cvExp: any[]): boolean {
  const kw = keyword.toLowerCase();

  // Common near-match mappings
  const nearMatches: Record<string, string[]> = {
    "js": ["javascript"],
    "javascript": ["js", "typescript", "ts", "nodejs", "node.js"],
    "typescript": ["ts", "javascript", "js"],
    "python": ["django", "flask", "fastapi", "data science", "ml"],
    "react": ["react native", "next.js", "nextjs", "jsx", "frontend"],
    "node.js": ["nodejs", "express", "node", "backend"],
    "nodejs": ["node.js", "express", "backend"],
    "aws": ["amazon web services", "cloud", "ec2", "lambda", "s3"],
    "azure": ["microsoft azure", "cloud"],
    "gcp": ["google cloud", "google cloud platform"],
    "kubernetes": ["k8s", "docker", "containers", "devops"],
    "docker": ["kubernetes", "containerization", "containers", "devops"],
    "sql": ["mysql", "postgresql", "postgres", "sqlite", "database", "db"],
    "postgresql": ["postgres", "sql", "database"],
    "mongodb": ["nosql", "database", "db"],
    "html": ["css", "web", "frontend", "markup"],
    "css": ["html", "sass", "scss", "tailwind", "styling", "frontend"],
    "rest": ["api", "http", "web services"],
    "graphql": ["api", "rest", "apollo"],
    "api": ["rest", "graphql", "backend", "web services"],
    "mobile": ["ios", "android", "react native", "flutter", "mobile development"],
    "ios": ["mobile", "swift", "apple", "iphone", "ipad"],
    "android": ["mobile", "kotlin", "java", "google"],
    "figma": ["design", "ui/ux", "prototype", "wireframe"],
    "machine learning": ["ml", "ai", "data science", "python", "tensorflow", "pytorch"],
    "data analysis": ["analytics", "data science", "sql", "python", "excel", "tableau"],
    "git": ["github", "gitlab", "version control", "source control"],
    "github": ["git", "gitlab", "version control"],
  };

  const nearList = nearMatches[kw];
  if (nearList) {
    if (cvSkills.some(s => nearList.includes(s))) return true;
    if (nearList.some(n => cvSummary.includes(n))) return true;
    // Check experience descriptions
    for (const exp of cvExp) {
      const desc = (exp.description || "").toLowerCase();
      const pos = (exp.position || "").toLowerCase();
      if (nearList.some(n => desc.includes(n) || pos.includes(n))) return true;
    }
  }

  // Partial match - if keyword is part of a skill or vice versa
  if (cvSkills.some(s => s.includes(kw) || kw.includes(s))) return true;

  return false;
}

function isHardSkill(keyword: string): boolean {
  const kw = keyword.toLowerCase().trim();

  if (isSoftTerm(kw)) return false;
  if (kw.length <= 2) return false;

  // Additional irrelevant terms
  const irrelevant = [
    "required", "preferred", "nice to have", "must have", "bonus", "ideal",
    "would be", "beneficial", "plus", "advantage", "desired", "optional",
  ];
  if (irrelevant.some(t => kw.includes(t))) return false;

  return true;
}

function calculateScore(
  matched: string[],
  missing: string[],
  jobKeywords: string[],
  cvSkills: string[],
  cvExp: any[],
  cvEdu: any[],
  cvSummary: string,
  jd: string
): number {
  let score = 0;

  // === Base score for having content (max 25 points) ===
  // Give credit just for having a CV with content
  if (cvSkills.length > 0) score += Math.min(10, cvSkills.length * 2); // up to 10 pts
  if (cvExp.length > 0) score += Math.min(10, cvExp.length * 3); // up to 10 pts
  if (cvEdu.length > 0) score += 5; // 5 pts for education

  // === Skill matching (max 35 points) ===
  const hardJobSkills = jobKeywords.filter(isHardSkill);
  if (hardJobSkills.length > 0) {
    const matchedHard = matched.filter(isHardSkill);
    const matchRatio = matchedHard.length / hardJobSkills.length;
    score += matchRatio * 35;
  } else if (jobKeywords.length > 0) {
    // If no hard skills detected, use all keywords
    score += (matched.length / jobKeywords.length) * 35;
  } else {
    // No keywords found in JD - give partial credit for having skills
    score += Math.min(15, cvSkills.length * 3);
  }

  // === Experience relevance (max 25 points) ===
  if (cvExp.length > 0) {
    let maxRelevance = 0;
    for (const exp of cvExp) {
      const pos = (exp.position || "").toLowerCase();
      const desc = (exp.description || "").toLowerCase();
      const company = (exp.company || "").toLowerCase();
      const combined = `${pos} ${desc} ${company}`;

      // Count keyword overlaps
      let matchCount = 0;
      for (const kw of jobKeywords) {
        if (combined.includes(kw)) matchCount++;
      }
      const relevance = Math.min(1, matchCount / Math.max(3, jobKeywords.length * 0.5));
      maxRelevance = Math.max(maxRelevance, relevance);
    }
    score += maxRelevance * 25;

    // Experience years bonus
    const totalYears = estimateYears(cvExp);
    if (totalYears >= 5) score += 5;
    else if (totalYears >= 2) score += 3;
  }

  // === Education relevance (max 10 points) ===
  if (cvEdu.length > 0) {
    const eduKeywords = ["bachelor", "master", "phd", "degree", "diploma", "bsc", "msc", "mba", "b.s", "m.s", "b.a", "m.a"];
    const jdRequiresEdu = eduKeywords.some(k => jd.includes(k));

    if (jdRequiresEdu) {
      // Check for relevant field of study
      for (const edu of cvEdu) {
        const field = (edu.field || "").toLowerCase();
        const degree = (edu.degree || "").toLowerCase();
        // Check if field or degree keywords appear in JD
        const fieldWords = field.split(/\s+/).filter(w => w.length > 3);
        const fieldInJd = fieldWords.some(word => jd.includes(word));
        if (fieldInJd) {
          score += 8;
          break;
        }
      }
      score += 2; // baseline for having education when required
    } else {
      score += 5; // some credit for education
    }
  }

  // === Summary alignment (max 5 points) ===
  if (cvSummary && cvSummary.length > 20) {
    const summaryWords = cvSummary.split(/\s+/).filter(w => w.length > 3);
    let overlap = 0;
    for (const word of summaryWords) {
      if (jd.includes(word)) overlap++;
    }
    const overlapRatio = Math.min(1, overlap / Math.max(1, summaryWords.length));
    score += overlapRatio * 5;
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
    strengths.push(`Key matching skills: ${directlyMatched.join(", ")}`);
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
      strengths.push(`${title} experience aligns well with this position`);
      if (strengths.length >= 2) break;
    }
  }

  // Education strength
  for (const edu of cvEdu) {
    const field = (edu.field || "").toLowerCase();
    const degree = (edu.degree || "").toLowerCase();
    if (field && jd.includes(field)) {
      strengths.push(`${degree ? degree + " in " : ""}${field} education directly relevant`);
      break;
    }
  }

  // Experience duration
  const totalYears = estimateYears(cvExp);
  if (totalYears >= 5) {
    strengths.push(`${totalYears}+ years of professional experience`);
  } else if (totalYears >= 2) {
    strengths.push(`${totalYears} years of relevant experience`);
  } else if (totalYears >= 1) {
    strengths.push(`Has professional work experience`);
  }

  // Ensure at least 1 strength
  if (strengths.length === 0) {
    if (cvSkills.length > 0) {
      strengths.push(`${cvSkills.length} professional skills listed`);
    } else if (cvExp.length > 0) {
      strengths.push("Has professional work experience");
    } else if (cvSummary) {
      strengths.push("Has a professional summary");
    } else {
      strengths.push("Ready to develop career");
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

  // Missing skills recommendations
  const topMissing = missing.slice(0, 3);
  for (const skill of topMissing) {
    const tools = ["aws", "azure", "gcp", "docker", "kubernetes", "figma", "jira",
      "salesforce", "tableau", "power bi", "git", "jenkins", "terraform"];
    const frameworks = ["react", "angular", "vue", "django", "flask", "spring",
      "express", "next.js", "nuxt", "flutter", "swift", "kotlin"];

    if (tools.some(t => skill.includes(t))) {
      recs.push(`Add ${skill} experience — consider a personal project or certification`);
    } else if (frameworks.some(f => skill.includes(f))) {
      recs.push(`Add ${skill} project experience — build a sample project or contribute to open-source`);
    } else {
      recs.push(`Add ${skill} to your skills section and demonstrate experience with it`);
    }
  }

  // Summary optimization
  if (!cvSummary || cvSummary.length < 50) {
    const jdKeyPhrases = extractTopKeywords(jd, 3);
    recs.push(`Add a professional summary with these job keywords: ${jdKeyPhrases.join(", ")}`);
  }

  // Experience recommendations
  if (cvExp.length === 0) {
    recs.push("Add work experience — even internships, freelance work, or academic projects help");
  } else {
    // Check if experience descriptions are missing
    for (const exp of cvExp) {
      const desc = (exp.description || "").trim();
      if (!desc) {
        recs.push(`Add achievement-focused bullets to your ${exp.position || exp.company || "work"} entry`);
        break;
      }
    }
  }

  // Education recommendation
  if (cvEdu.length === 0) {
    const jdEduMentioned = /degree|bachelor|master|diploma|education/i.test(jd);
    if (jdEduMentioned) {
      recs.push("Add your educational background — this job values formal education");
    }
  }

  // Ensure 3-5 recommendations
  if (recs.length < 3 && missing.length > 3) {
    recs.push(`Consider gaining experience with: ${missing.slice(3, 6).join(", ")}`);
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

  const words = jd.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([w]) => w);
}
