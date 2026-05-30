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
    const summary = generateTemplateSummary(fullName, skills, workExperience, education);

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

function generateTemplateSummary(
  fullName: string,
  skills: string[],
  workExperience: any[],
  education: any[]
): string {
  const name = fullName || "";
  const topSkills = (skills || []).slice(0, 5);
  const exp = workExperience || [];
  const edu = education || [];

  // Build experience-based description
  const latestJob = exp[0];
  const totalExp = exp.length;
  const yearsExp = estimateYears(exp);

  // Build education-based description
  const latestEdu = edu[0];
  const hasDegree = latestEdu?.degree;

  // Generate summary parts
  let parts: string[] = [];

  // Opening statement
  if (name) {
    if (latestJob?.position) {
      parts.push(`${name} is an experienced ${latestJob.position}${latestJob.company ? ` with a proven track record at ${latestJob.company}` : ""}`);
    } else if (topSkills.length > 0) {
      parts.push(`${name} is a skilled professional specializing in ${topSkills.slice(0, 2).join(" and ")}`);
    } else {
      parts.push(`${name} is a dedicated professional with a strong commitment to excellence`);
    }
  } else {
    if (latestJob?.position) {
      parts.push(`Experienced ${latestJob.position} with a demonstrated history of delivering results`);
    } else if (topSkills.length > 0) {
      parts.push(`Skilled professional specializing in ${topSkills.slice(0, 2).join(" and ")}`);
    } else {
      parts.push(`Dedicated professional with a passion for excellence and continuous improvement`);
    }
  }

  // Add experience depth
  if (totalExp > 1) {
    parts.push(`with ${yearsExp} of professional experience across ${totalExp} roles`);
  } else if (yearsExp) {
    parts.push(`with ${yearsExp} of hands-on experience`);
  }

  // Add skills expertise
  if (topSkills.length > 0) {
    const skillStr = topSkills.length > 3
      ? `${topSkills.slice(0, 3).join(", ")}, and ${topSkills[3]}`
      : topSkills.join(" and ");
    parts.push(`I bring strong expertise in ${skillStr}`);
  }

  // Add education context
  if (hasDegree) {
    parts.push(`My educational background includes a ${latestEdu.degree}${latestEdu.field ? ` in ${latestEdu.field}` : ""}${latestEdu.institution ? ` from ${latestEdu.institution}` : ""}`);
  }

  // Add value proposition
  const valueProps = getValueProposition(skills, workExperience);
  parts.push(valueProps);

  // Combine parts into cohesive paragraphs
  return combineSentences(parts);
}

function estimateYears(experience: any[]): string {
  if (!experience.length) return "";

  const currentYear = new Date().getFullYear();
  const years = experience
    .map(e => {
      const start = parseInt(e.start_date?.split(" ")[1]) || currentYear - 3;
      const end = e.current ? currentYear : parseInt(e.end_date?.split(" ")[1]) || currentYear;
      return Math.max(1, end - start);
    })
    .reduce((a, b) => a + b, 0);

  if (years >= 10) return `${years}+ years`;
  if (years >= 5) return `${years} years`;
  if (years >= 2) return `${years} years`;
  return `${years}+ year`;
}

function getValueProposition(skills: string[], experience: any[]): string {
  const skillSet = new Set((skills || []).map(s => s.toLowerCase()));
  const positions = (experience || []).map(e => (e.position || "").toLowerCase());

  // Check for leadership roles
  const isLeader = positions.some(p =>
    p.includes("manager") || p.includes("lead") || p.includes("director") || p.includes("head")
  );

  // Check for tech roles
  const isTech = skillSet.has("javascript") || skillSet.has("python") || skillSet.has("react") ||
    skillSet.has("node") || skillSet.has("sql") || positions.some(p =>
      p.includes("engineer") || p.includes("developer") || p.includes("programmer")
    );

  // Check for design roles
  const isDesign = skillSet.has("figma") || skillSet.has("ui/ux") || positions.some(p =>
    p.includes("designer") || p.includes("ux") || p.includes("product")
  );

  // Check for data roles
  const isData = skillSet.has("analytics") || skillSet.has("sql") || skillSet.has("python") ||
    positions.some(p => p.includes("analyst") || p.includes("data") || p.includes("scientist"));

  // Generate appropriate value prop
  if (isLeader) {
    return "I am passionate about leading high-performing teams and driving strategic initiatives that deliver measurable business outcomes";
  }
  if (isTech) {
    return "I am passionate about building scalable, innovative solutions that solve complex problems and create exceptional user experiences";
  }
  if (isDesign) {
    return "I am passionate about creating intuitive, user-centered designs that bridge aesthetics with functionality";
  }
  if (isData) {
    return "I am passionate about transforming data into actionable insights that drive informed decision-making and strategic growth";
  }

  return "I am passionate about contributing to innovative teams and driving meaningful impact through collaboration and continuous learning";
}

function combineSentences(parts: string[]): string {
  if (parts.length === 0) return "";

  // Group into paragraphs
  const paragraph1 = parts.slice(0, 2).join(" ");
  const paragraph2 = parts.slice(2).join(". ");

  if (paragraph2) {
    return `${paragraph1}. ${paragraph2}.`;
  }
  return `${paragraph1}.`;
}
