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
    const { summary, skills, education, workExperience, fullName, email, phone } = await req.json();
    const result = scoreCV(summary, skills, education, workExperience, fullName, email, phone);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to score CV" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

interface ScoreResult {
  score: number;
  grade: "Excellent" | "Good" | "Average" | "Weak";
  strengths: string[];
  weaknesses: string[];
  atsIssues: string[];
  improvements: string[];
}

function scoreCV(
  summary: string,
  skills: string[],
  education: any[],
  workExperience: any[],
  fullName: string,
  email: string,
  phone: string
): ScoreResult {
  const cvSkills = (skills || []).map((s: string) => s.trim()).filter(Boolean);
  const cvSummary = (summary || "").trim();
  const cvExp = workExperience || [];
  const cvEdu = education || [];
  const cvName = (fullName || "").trim();
  const cvEmail = (email || "").trim();
  const cvPhone = (phone || "").trim();

  let score = 0;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const atsIssues: string[] = [];
  const improvements: string[] = [];

  // ===== 1. Contact Completeness (0-10) =====
  let contactScore = 0;
  const contactMissing: string[] = [];
  if (cvName) contactScore += 3; else contactMissing.push("full name");
  if (cvEmail) contactScore += 3; else contactMissing.push("email");
  if (cvPhone) contactScore += 2; else contactMissing.push("phone number");

  if (contactScore >= 8) {
    strengths.push("Complete contact information present");
  } else if (contactMissing.length > 0) {
    weaknesses.push(`Missing contact info: ${contactMissing.join(", ")}`);
    atsIssues.push(`ATS systems require ${contactMissing[0]} for parsing — add it to avoid automatic rejection`);
    improvements.push(`Add your ${contactMissing[0]} to the contact section`);
  }

  // ===== 2. Professional Summary (0-25) =====
  let summaryScore = 0;
  if (!cvSummary) {
    weaknesses.push("No professional summary — this is the first thing recruiters read");
    atsIssues.push("Missing summary section reduces keyword density for ATS parsing");
    improvements.push("Write a 3-5 sentence professional summary highlighting your top skills and experience");
  } else {
    const wordCount = cvSummary.split(/\s+/).length;
    const summaryLower = cvSummary.toLowerCase();

    // Length scoring
    if (wordCount >= 30 && wordCount <= 80) {
      summaryScore += 8;
      strengths.push("Summary is an ideal length (30-80 words)");
    } else if (wordCount >= 15 && wordCount < 30) {
      summaryScore += 4;
      weaknesses.push("Summary is too short — aim for 30-80 words for impact");
      improvements.push("Expand your summary to 3-5 sentences covering key skills, experience level, and career focus");
    } else if (wordCount > 80) {
      summaryScore += 3;
      weaknesses.push("Summary is too long — keep it concise (30-80 words)");
      improvements.push("Trim your summary to 3-5 focused sentences; move extra detail to experience bullets");
    } else {
      summaryScore += 1;
      weaknesses.push("Summary is critically short — barely any content");
      improvements.push("Write a proper 3-5 sentence summary that showcases your strengths");
    }

    // First-person check (ATS neutral, but quality signal)
    const usesFirstPerson = /\b(i am|i bring|i have|i led|i built|i managed|i developed|i designed|i drive|i deliver)\b/i.test(cvSummary);
    if (usesFirstPerson) summaryScore += 3;

    // Keyword density — does summary mention skills from the skills section?
    const skillsInSummary = cvSkills.filter(s =>
      summaryLower.includes(s.toLowerCase())
    );
    if (skillsInSummary.length >= 2) {
      summaryScore += 6;
      strengths.push(`Summary includes ${skillsInSummary.length} key skills (${skillsInSummary.slice(0, 3).join(", ")})`);
    } else if (skillsInSummary.length === 1) {
      summaryScore += 3;
      improvements.push("Include more of your key skills in the summary for better ATS keyword matching");
    } else if (cvSkills.length > 0) {
      summaryScore += 1;
      weaknesses.push("Summary doesn't mention any of your listed skills");
      atsIssues.push("ATS relies on summary keyword density — missing skills here reduces match probability");
      improvements.push("Weave your top 2-3 skills into the summary naturally");
    }

    // Avoid filler phrases
    const fillerPhrases = [
      "hardworking", "self-starter", "team player", "go-getter",
      "think outside the box", "synergy", "results-driven professional",
      "dynamic individual", "highly motivated", "passionate about",
      "dedicated professional", "strong work ethic", "proven track record",
    ];
    const foundFillers = fillerPhrases.filter(f => summaryLower.includes(f));
    if (foundFillers.length === 0) {
      summaryScore += 4;
    } else {
      summaryScore += 1;
      weaknesses.push(`Summary contains filler phrases: "${foundFillers[0]}" — replace with specific accomplishments`);
      improvements.push(`Replace "${foundFillers[0]}" with a concrete achievement or skill`);
    }

    // Specificity — contains numbers/achievements
    const hasNumbers = /\d+%|\d+\+|\$[\d,]+|\d+ (years|projects|clients|team|users)/i.test(cvSummary);
    if (hasNumbers) {
      summaryScore += 4;
      strengths.push("Summary includes quantifiable achievements (numbers, years, metrics)");
    } else {
      improvements.push("Add a quantifiable achievement to your summary (e.g., '5+ years experience', 'managed 3 products')");
    }
  }

  // ===== 3. Skills Quality (0-20) =====
  let skillsScore = 0;
  if (cvSkills.length === 0) {
    weaknesses.push("No skills listed — this is a major gap");
    atsIssues.push("Skills section is critical for ATS keyword matching; without it, your CV will score poorly");
    improvements.push("Add at least 8-12 relevant skills that match your target roles");
  } else if (cvSkills.length < 5) {
    skillsScore += 5;
    weaknesses.push(`Only ${cvSkills.length} skills listed — aim for 8-15 for comprehensive ATS coverage`);
    improvements.push("Add more skills to reach 8-15 — include both technical and soft skills relevant to your field");
  } else if (cvSkills.length <= 15) {
    skillsScore += 14;
    strengths.push(`${cvSkills.length} skills listed — good range for ATS matching`);
  } else if (cvSkills.length <= 25) {
    skillsScore += 12;
    strengths.push(`${cvSkills.length} skills listed — comprehensive list`);
  } else {
    skillsScore += 8;
    weaknesses.push("Excessive skill count may look like keyword stuffing to recruiters");
    improvements.push("Trim skills to your top 12-15 most relevant ones; quality over quantity");
  }

  // Skill specificity
  const genericSkills = cvSkills.filter(s =>
    /\b(good|great|hardworking|team player| motivated|creative|passionate|communication|leadership)\b/i.test(s)
  );
  if (genericSkills.length > 0 && genericSkills.length === cvSkills.length) {
    skillsScore += 0;
    weaknesses.push("Skills are too generic — replace with specific, searchable terms");
    atsIssues.push("Generic skills like 'communication' don't help ATS keyword matching");
    improvements.push("Replace generic skills with specific ones (e.g., 'Stakeholder Communication' or 'Technical Writing')");
  } else if (genericSkills.length > 0) {
    skillsScore += 3;
    improvements.push(`Replace generic skill "${genericSkills[0]}" with a more specific, searchable term`);
  } else {
    skillsScore += 6;
  }

  // ===== 4. Work Experience (0-30) =====
  let expScore = 0;
  if (cvExp.length === 0) {
    weaknesses.push("No work experience listed");
    atsIssues.push("Experience section is the heaviest-weighted by ATS — without it, scoring will be minimal");
    improvements.push("Add work experience including position, company, dates, and achievement-focused descriptions");
  } else {
    // Number of roles
    if (cvExp.length >= 3) {
      expScore += 6;
      strengths.push(`${cvExp.length} work experiences show career progression`);
    } else if (cvExp.length === 2) {
      expScore += 4;
    } else {
      expScore += 2;
      improvements.push("Add more work experience to demonstrate career depth");
    }

    // Check each experience entry for completeness
    let emptyDescriptions = 0;
    let missingCompanies = 0;
    let missingDates = 0;
    let totalBulletPoints = 0;
    let entriesWithNumbers = 0;
    let entriesWithActionVerbs = 0;

    const actionVerbs = [
      "led", "built", "managed", "developed", "designed", "implemented",
      "launched", "improved", "increased", "reduced", "created", "delivered",
      "optimized", "automated", "coordinated", "established", "drove",
      "architected", "negotiated", "streamlined", "scaled", "shipped",
      "spearheaded", "transformed", "pioneered", "executed", "achieved",
    ];

    for (const exp of cvExp) {
      const desc = (exp.description || "").trim();
      const company = (exp.company || "").trim();
      const position = (exp.position || "").trim();
      const startDate = (exp.start_date || "").trim();

      if (!desc) emptyDescriptions++;
      if (!company) missingCompanies++;
      if (!startDate) missingDates++;

      if (desc) {
        const bullets = desc.split(/\n/).filter((l: string) => l.trim().length > 0);
        totalBulletPoints += bullets.length;

        const descLower = desc.toLowerCase();
        if (/\d+%|\$[\d,]+|\d+x|\d+\+|\d+ (users|clients|projects|team|people|engineers)/i.test(desc)) {
          entriesWithNumbers++;
        }
        if (actionVerbs.some(v => descLower.includes(v))) {
          entriesWithActionVerbs++;
        }
      }
    }

    // Description quality
    if (emptyDescriptions > 0) {
      const pct = Math.round((emptyDescriptions / cvExp.length) * 100);
      weaknesses.push(`${emptyDescriptions} of ${cvExp.length} experience entries have no description`);
      atsIssues.push("Empty experience descriptions give ATS zero content to match against");
      if (emptyDescriptions === cvExp.length) {
        expScore += 0;
      } else {
        expScore += 2;
      }
      improvements.push("Add achievement-focused bullet points (3-5 per role) to every experience entry");
    } else {
      // All have descriptions
      const avgBullets = totalBulletPoints / cvExp.length;
      if (avgBullets >= 4) {
        expScore += 8;
        strengths.push("Experience descriptions are detailed with multiple bullet points");
      } else if (avgBullets >= 2) {
        expScore += 5;
        improvements.push("Add more bullet points to experience entries — aim for 3-5 per role");
      } else {
        expScore += 2;
        weaknesses.push("Experience descriptions are too brief");
        improvements.push("Expand each experience to 3-5 bullet points starting with action verbs");
      }
    }

    // Achievement quantification
    if (entriesWithNumbers > 0 && entriesWithNumbers === cvExp.length) {
      expScore += 6;
      strengths.push("All experience entries include quantifiable achievements");
    } else if (entriesWithNumbers > 0) {
      expScore += 3;
      improvements.push("Add metrics to more experience entries — quantify impact wherever possible");
    } else if (cvExp.some(e => (e.description || "").trim())) {
      expScore += 1;
      weaknesses.push("No quantified achievements in experience descriptions");
      improvements.push("Add numbers to your experience (e.g., 'Increased sales by 20%', 'Managed team of 8')");
    }

    // Action verbs
    if (entriesWithActionVerbs > 0) {
      expScore += 4;
    } else if (cvExp.some(e => (e.description || "").trim())) {
      weaknesses.push("Experience bullets don't start with strong action verbs");
      improvements.push("Start each bullet with a strong verb (Led, Built, Designed, Improved, Launched)");
    }

    // Company names
    if (missingCompanies > 0) {
      atsIssues.push("Missing company names prevent ATS from recognizing employment history");
      improvements.push("Add company names to all experience entries");
    }

    // Date consistency
    if (missingDates > 0) {
      atsIssues.push("Missing dates on experience entries can cause ATS parsing errors");
      improvements.push("Add start and end dates to all experience entries");
    } else {
      expScore += 4;
      strengths.push("All experience entries have complete date information");
    }
  }

  // ===== 5. Education (0-15) =====
  let eduScore = 0;
  if (cvEdu.length === 0) {
    weaknesses.push("No education listed");
    atsIssues.push("Many ATS systems filter by education — missing section may auto-reject");
    improvements.push("Add your education including degree, field, and institution");
  } else {
    eduScore += 4;

    let hasDegree = false;
    let hasField = false;
    let hasInstitution = false;

    for (const edu of cvEdu) {
      if ((edu.degree || "").trim()) hasDegree = true;
      if ((edu.field || "").trim()) hasField = true;
      if ((edu.institution || "").trim()) hasInstitution = true;
    }

    if (hasDegree) {
      eduScore += 4;
      strengths.push("Degree information provided");
    } else {
      weaknesses.push("Education entries missing degree type (e.g., Bachelor, Master)");
      improvements.push("Specify your degree type in each education entry");
    }

    if (hasField) {
      eduScore += 3;
    } else {
      weaknesses.push("Education entries missing field of study");
      atsIssues.push("Missing field of study reduces ATS keyword matching for degree-specific roles");
      improvements.push("Add your field of study to each education entry");
    }

    if (hasInstitution) {
      eduScore += 4;
    } else {
      improvements.push("Add institution names to your education entries");
    }
  }

  // ===== Calculate Total =====
  score = contactScore + summaryScore + skillsScore + expScore + eduScore;
  score = Math.min(100, Math.max(0, Math.round(score)));

  let grade: ScoreResult["grade"];
  if (score >= 90) grade = "Excellent";
  else if (score >= 70) grade = "Good";
  else if (score >= 50) grade = "Average";
  else grade = "Weak";

  // Dedup improvements
  const uniqueImprovements = [...new Set(improvements)].slice(0, 6);
  const uniqueWeaknesses = [...new Set(weaknesses)].slice(0, 6);
  const uniqueAtsIssues = [...new Set(atsIssues)].slice(0, 5);
  const uniqueStrengths = [...new Set(strengths)].slice(0, 6);

  return {
    score,
    grade,
    strengths: uniqueStrengths,
    weaknesses: uniqueWeaknesses,
    atsIssues: uniqueAtsIssues,
    improvements: uniqueImprovements,
  };
}
