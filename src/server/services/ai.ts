import fs from "fs";
import path from "path";

// Helper to safely get GEMINI_API_KEY from environment or .env.local without exposing it
function getGeminiApiKey(): string | null {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();

  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.startsWith("GEMINI_API_KEY=")) {
          let val = trimmed.substring("GEMINI_API_KEY=".length).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          return val.trim();
        }
      }
    }
  } catch {}

  return null;
}

export interface ExtractedPaperMetadata {
  title: string | null;
  authors: string[];
  publicationYear: number | string | null;
  journalOrConference: string | null;
  doi: string | null;
  abstract: string | null;
  keywords: string[];
}

/**
 * Extracts bibliographic metadata from an academic paper PDF using Gemini AI.
 * Strictly extracts only what is present in the document without hallucinating missing fields.
 */
export async function extractPaperMetadataWithGemini(options: {
  fileData?: string; // base64 string or data URL
  fileName?: string;
  textContent?: string;
}): Promise<{ success: boolean; metadata?: ExtractedPaperMetadata; modelUsed?: string; error?: string }> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: "GEMINI_API_KEY environment variable is missing on the server.",
    };
  }

  // Prepare base64 data
  let base64Clean = "";
  if (options.fileData) {
    if (options.fileData.includes(";base64,")) {
      base64Clean = options.fileData.split(";base64,")[1];
    } else {
      base64Clean = options.fileData;
    }
  }

  // System instructions for Gemini
  const promptText = `You are a precise academic bibliographic metadata extractor.
Analyze the provided academic paper (PDF document or text).
Extract ONLY information that is explicitly present in the document.

Return ONLY a valid JSON object matching this exact schema:
{
  "title": string or null,
  "authors": array of strings (names of human authors only, NO affiliations, departments, or institutions),
  "publicationYear": number or string or null,
  "journalOrConference": string or null,
  "doi": string or null,
  "abstract": string or null,
  "keywords": array of strings
}

CRITICAL RULES:
1. TITLE: Extract the actual paper title. Do NOT use the filename unless no title exists in the document. Do NOT invent a title.
2. AUTHORS: Extract only actual author names. Do NOT include author affiliations, universities, departments, email addresses, or supervisors as authors. If authors cannot be confidently identified, return [].
3. PUBLICATION YEAR: Extract only if clearly present in the document. Return null if unavailable.
4. JOURNAL / CONFERENCE: Extract journal or conference name if present. Return null if unavailable.
5. DOI: Extract DOI only if explicitly present (e.g., 10.xxxx/xxxx). Do NOT generate or guess a DOI. Return null if unavailable.
6. ABSTRACT: Extract the actual abstract text if present. Do NOT generate a new abstract. Return null if unavailable.
7. KEYWORDS: Extract explicit keywords if present. Return [] if unavailable.
8. DO NOT INVENT OR HALLUCINATE ANY MISSING INFORMATION.`;

  // Build API payload
  const parts: any[] = [];
  if (base64Clean) {
    parts.push({
      inlineData: {
        mimeType: "application/pdf",
        data: base64Clean,
      },
    });
  }

  if (options.textContent) {
    parts.push({
      text: `Extracted Text Content:\n${options.textContent.slice(0, 8000)}\n\n${promptText}`,
    });
  } else {
    parts.push({
      text: promptText,
    });
  }

  // Discover working model
  let availableModels: string[] = [];
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (listRes.ok) {
      const listData = await listRes.json();
      if (listData && Array.isArray(listData.models)) {
        availableModels = listData.models
          .filter((m: any) => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
          .map((m: any) => m.name.replace(/^models\//, ""));
      }
    }
  } catch {}

  const fallbackList = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash"];
  const candidateModels = [...new Set([...availableModels, ...fallbackList])].filter((m) => m !== "gemini-pro");

  let lastError = "";

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const candidate = data.candidates?.[0];
        const rawText = candidate?.content?.parts?.[0]?.text;

        if (rawText) {
          // Parse JSON safely
          let jsonStr = rawText.trim();
          if (jsonStr.startsWith("```json")) {
            jsonStr = jsonStr.replace(/^```json/, "").replace(/```$/, "").trim();
          } else if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.replace(/^```/, "").replace(/```$/, "").trim();
          }

          const parsed = JSON.parse(jsonStr);

          // Format metadata
          const metadata: ExtractedPaperMetadata = {
            title: parsed.title ? String(parsed.title).trim() : null,
            authors: Array.isArray(parsed.authors)
              ? parsed.authors.map((a: any) => String(a).trim()).filter(Boolean)
              : [],
            publicationYear: parsed.publicationYear ? parsed.publicationYear : null,
            journalOrConference: parsed.journalOrConference ? String(parsed.journalOrConference).trim() : null,
            doi: parsed.doi ? String(parsed.doi).trim() : null,
            abstract: parsed.abstract ? String(parsed.abstract).trim() : null,
            keywords: Array.isArray(parsed.keywords)
              ? parsed.keywords.map((k: any) => String(k).trim()).filter(Boolean)
              : [],
          };

          return {
            success: true,
            metadata,
            modelUsed: model,
          };
        }
      } else {
        const errBody = await res.text();
        const sanitizedErr = errBody.replace(new RegExp(apiKey, "g"), "[REDACTED_API_KEY]");
        lastError = `HTTP ${res.status} (${model}): ${sanitizedErr}`;
      }
    } catch (e: any) {
      const msg = e?.message || String(e);
      const sanitizedErr = msg.replace(new RegExp(apiKey, "g"), "[REDACTED_API_KEY]");
      lastError = `Error (${model}): ${sanitizedErr}`;
    }
  }

  return {
    success: false,
    error: lastError || "Failed to extract metadata using Gemini models.",
  };
}

export interface AcademicPaperSummary {
  overview: string;
  researchObjective: string;
  problemStatement: string;
  methodology: string;
  dataset: string;
  algorithms: string;
  keyFindings: string;
  advantages: string;
  limitations: string;
  futureWork: string;
  keyTakeaway: string;
}

/**
 * Helper to extract text locally from a PDF Buffer using pdf-parse with stream fallback.
 */
export async function extractTextFromPdfBuffer(pdfBuffer: Buffer): Promise<string> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
    const result = await parser.getText();
    let text = "";
    if (typeof result === "string") {
      text = result;
    } else if (result && typeof (result as any).text === "string") {
      text = (result as any).text;
    }
    if (text && text.trim().length > 50) {
      return text.trim();
    }
  } catch (err) {
    console.warn("[PDF Extractor] pdf-parse error, falling back to raw stream parsing:", err);
  }

  // Fallback stream text extraction
  try {
    const zlib = await import("node:zlib");
    const pdfString = pdfBuffer.toString("binary");
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    const extractedTexts: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = streamRegex.exec(pdfString)) !== null) {
      const streamContent = match[1];
      let decoded = streamContent;
      try {
        const streamBuffer = Buffer.from(streamContent, "binary");
        const decompressed = zlib.inflateSync(streamBuffer);
        decoded = decompressed.toString("utf8");
      } catch {}

      const textMatches = decoded.match(/\(([^)]+)\)\s*(?:Tj|TJ|'|")/g) || decoded.match(/\[([^\]]+)\]\s*TJ/g);
      if (textMatches) {
        for (const tm of textMatches) {
          const cleaned = tm.replace(/[\\()\[\]]|Tj|TJ|'/g, " ").trim();
          if (cleaned.length > 2) extractedTexts.push(cleaned);
        }
      }
    }

    if (extractedTexts.length > 0) {
      return extractedTexts.join(" ");
    }
  } catch {}

  return "";
}

/**
 * Preprocesses raw academic text by stripping repetitive headers/footers/page numbers
 * while preserving section headings, paragraph structure, tables, formulas, and numerical metrics.
 */
export function preprocessAcademicText(rawText: string): string {
  if (!rawText) return "";

  const lines = rawText.split(/\r?\n/);
  const cleanedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip standalone page number lines like "Page 1 of 12" or "12"
    if (/^(?:page\s*\d+(?:\s*of\s*\d+)?|\d{1,3})$/i.test(trimmed)) {
      continue;
    }
    // Skip generic repeating running headers
    if (/^(?:https?:\/\/|www\.|doi:10\.)/i.test(trimmed) && trimmed.length < 60) {
      continue;
    }
    cleanedLines.push(line);
  }

  const normalizedText = cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n");
  return normalizedText.trim();
}

/**
 * Generates a structured 11-section academic paper summary using Gemini AI.
 * Uses fast local PDF text extraction to achieve 3-10s execution.
 * Strictly relies on the provided paper document/text without hallucinating missing fields.
 */
export async function generatePaperSummaryWithGemini(options: {
  fileData?: string; // base64 string or data URL
  title?: string;
  authors?: string;
  year?: string;
  journal?: string;
  abstract?: string;
  textContent?: string;
}): Promise<{ success: boolean; summary?: AcademicPaperSummary; modelUsed?: string; error?: string }> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: "GEMINI_API_KEY environment variable is missing on the server.",
    };
  }

  let base64Clean = "";
  if (options.fileData) {
    if (options.fileData.includes(";base64,")) {
      base64Clean = options.fileData.split(";base64,")[1];
    } else {
      base64Clean = options.fileData;
    }
  }

  // Step 1: Attempt High-Speed Local PDF Text Extraction
  let paperText = options.textContent || "";
  if (!paperText && base64Clean) {
    try {
      const pdfBuffer = Buffer.from(base64Clean, "base64");
      paperText = await extractTextFromPdfBuffer(pdfBuffer);
    } catch (err) {
      console.warn("[Summarization] Local PDF text extraction failed, falling back to multimodal:", err);
    }
  }

  // Step 2: Clean and preprocess extracted text
  if (paperText) {
    paperText = preprocessAcademicText(paperText);
  }

  const promptInstructions = `You are a world-class academic researcher and literature synthesis expert.
Analyze the provided academic paper.
Generate a rigorous, structured academic analysis.

CRITICAL ACADEMIC INTEGRITY INSTRUCTIONS:
- Analyze ONLY the provided paper document or paper text.
- NEVER invent or fabricate information, datasets, numerical results, performance metrics, algorithms, limitations, citations, or future work.
- Preserve all numerical values, accuracy rates, F1 scores, dataset sizes, training/val/test splits, batch sizes, learning rates, parameter counts, and baseline model comparisons with their exact metric context.
- If specific details for a section are not explicitly stated or inferred directly from the provided paper, you MUST write "Not specified in the paper." for that section.
- NEVER infer unsupported numerical values.

Return ONLY a valid JSON object matching this exact schema:
{
  "overview": "A clear 2-3 sentence academic overview of the paper.",
  "researchObjective": "Primary goal, research questions, or intent of the study.",
  "problemStatement": "Specific scientific, mathematical, or engineering problem addressed.",
  "methodology": "Detailed research design, experimental methodology, framework, or process.",
  "dataset": "Datasets, benchmark samples, sample size, or measurements used (or 'Not specified in the paper.')",
  "algorithms": "Algorithms, models, neural architectures, formulas, or key techniques employed.",
  "keyFindings": "Main quantitative and qualitative findings, empirical results, and key benchmarks.",
  "advantages": "Key contributions, advantages, efficiency gains, or technical innovations.",
  "limitations": "Documented limitations, constraints, edge cases, or theoretical trade-offs.",
  "futureWork": "Future research directions, open challenges, or prospective extensions.",
  "keyTakeaway": "One authoritative overarching academic conclusion highlighting the core contribution."
}`;

  const parts: any[] = [];

  // Step 3: Fast Textual Payload Construction vs Multimodal Fallback
  if (paperText && paperText.length > 50) {
    const contextHeader = [
      options.title ? `Paper Title: ${options.title}` : "",
      options.authors ? `Authors: ${options.authors}` : "",
      options.year ? `Publication Year: ${options.year}` : "",
      options.journal ? `Journal/Venue: ${options.journal}` : "",
      options.abstract ? `Abstract: ${options.abstract}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    let fullPaperContent = paperText;
    if (paperText.length > 100000) {
      const part1 = paperText.slice(0, 30000);
      const part2 = paperText.slice(30000, 60000);
      const part3 = paperText.slice(60000, 90000);
      const part4 = paperText.slice(-20000);

      fullPaperContent = `[SECTION 1: OVERVIEW & INTRODUCTION]\n${part1}\n\n[SECTION 2: METHODOLOGY & ARCHITECTURE]\n${part2}\n\n[SECTION 3: EXPERIMENTS, DATASETS & RESULTS]\n${part3}\n\n[SECTION 4: DISCUSSION, LIMITATIONS & CONCLUSION]\n${part4}`;
    }

    parts.push({
      text: `${contextHeader ? contextHeader + "\n\n" : ""}FULL ACADEMIC PAPER TEXT:\n${fullPaperContent}\n\n${promptInstructions}`,
    });
  } else if (base64Clean) {
    // Fallback for image-only scanned PDFs without readable text layer
    parts.push({
      inlineData: {
        mimeType: "application/pdf",
        data: base64Clean,
      },
    });
    const contextHeader = [
      options.title ? `Title: ${options.title}` : "",
      options.authors ? `Authors: ${options.authors}` : "",
      options.year ? `Year: ${options.year}` : "",
      options.journal ? `Journal/Venue: ${options.journal}` : "",
      options.abstract ? `Stored Abstract: ${options.abstract}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    parts.push({
      text: `${contextHeader ? contextHeader + "\n\n" : ""}${promptInstructions}`,
    });
  } else {
    // Title/Abstract-only fallback
    const contextHeader = [
      options.title ? `Title: ${options.title}` : "",
      options.authors ? `Authors: ${options.authors}` : "",
      options.year ? `Year: ${options.year}` : "",
      options.journal ? `Journal/Venue: ${options.journal}` : "",
      options.abstract ? `Stored Abstract: ${options.abstract}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    parts.push({
      text: `Paper Context:\n${contextHeader}\n\n${promptInstructions}`,
    });
  }

  // Discover working models
  let availableModels: string[] = [];
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (listRes.ok) {
      const listData = await listRes.json();
      if (listData && Array.isArray(listData.models)) {
        availableModels = listData.models
          .filter((m: any) => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
          .map((m: any) => m.name.replace(/^models\//, ""));
      }
    }
  } catch {}

  const fallbackList = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash"];
  const candidateModels = [...new Set([...availableModels, ...fallbackList])].filter((m) => m !== "gemini-pro");
  let lastError = "";

  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second strict timeout

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const candidate = data.candidates?.[0];
        const rawText = candidate?.content?.parts?.[0]?.text;

        if (rawText) {
          let jsonStr = rawText.trim();
          if (jsonStr.startsWith("```json")) {
            jsonStr = jsonStr.replace(/^```json/, "").replace(/```$/, "").trim();
          } else if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.replace(/^```/, "").replace(/```$/, "").trim();
          }

          const parsed = JSON.parse(jsonStr);

          const summary: AcademicPaperSummary = {
            overview: parsed.overview ? String(parsed.overview).trim() : "Not specified in the paper.",
            researchObjective: parsed.researchObjective ? String(parsed.researchObjective).trim() : "Not specified in the paper.",
            problemStatement: parsed.problemStatement ? String(parsed.problemStatement).trim() : "Not specified in the paper.",
            methodology: parsed.methodology ? String(parsed.methodology).trim() : "Not specified in the paper.",
            dataset: parsed.dataset ? String(parsed.dataset).trim() : "Not specified in the paper.",
            algorithms: parsed.algorithms ? String(parsed.algorithms).trim() : "Not specified in the paper.",
            keyFindings: parsed.keyFindings ? String(parsed.keyFindings).trim() : "Not specified in the paper.",
            advantages: parsed.advantages ? String(parsed.advantages).trim() : "Not specified in the paper.",
            limitations: parsed.limitations ? String(parsed.limitations).trim() : "Not specified in the paper.",
            futureWork: parsed.futureWork ? String(parsed.futureWork).trim() : "Not specified in the paper.",
            keyTakeaway: parsed.keyTakeaway ? String(parsed.keyTakeaway).trim() : "Not specified in the paper.",
          };

          return {
            success: true,
            summary,
            modelUsed: model,
          };
        }
      } else {
        const errBody = await res.text();
        const sanitizedErr = errBody.replace(new RegExp(apiKey, "g"), "[REDACTED_API_KEY]");
        lastError = `HTTP ${res.status} (${model}): ${sanitizedErr}`;
      }
    } catch (e: any) {
      const msg = e?.name === "AbortError" ? "Request timed out after 60s" : e?.message || String(e);
      const sanitizedErr = msg.replace(new RegExp(apiKey, "g"), "[REDACTED_API_KEY]");
      lastError = `Error (${model}): ${sanitizedErr}`;
    }
  }

  return {
    success: false,
    error: lastError || "Failed to generate academic summary using Gemini models.",
  };
}

export interface ResearchRoadmapWeek {
  week: number;
  title: string;
  objective: string;
  tasks: string[];
  deliverable: string;
  mentorTip?: string;
}

export interface GeneratedRoadmapResult {
  success: boolean;
  durationWeeks?: number;
  roadmap?: ResearchRoadmapWeek[];
  modelUsed?: string;
  error?: string;
}

/**
 * Generates a step-by-step academic research roadmap for a student project using Gemini AI.
 */
export async function generateResearchRoadmapWithGemini(options: {
  projectTitle: string;
  domain?: string;
  abstract?: string;
  durationWeeks?: number;
  progress?: number;
  status?: string;
  researchWorksCount?: number;
  hasResearchPaper?: boolean;
  reviewStatus?: string;
  savedPapersCount?: number;
}): Promise<GeneratedRoadmapResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: "GEMINI_API_KEY environment variable is missing on the server.",
    };
  }

  const duration = options.durationWeeks || 6;
  const domainStr = options.domain ? `Domain / Field: ${options.domain}` : "";
  const abstractStr = options.abstract ? `Project Context / Abstract: ${options.abstract}` : "";
  const progressStr = `Current Project Progress: ${options.progress || 0}% (${options.status || "In Progress"})`;
  const worksStr = `Drafted Research Documents: ${options.researchWorksCount || 0} (Has Written Research Paper: ${options.hasResearchPaper ? "YES" : "NO"})`;
  const reviewStr = `Faculty Supervisor Review Status: ${options.reviewStatus || "None"}`;
  const papersStr = `Saved Reference Library Papers: ${options.savedPapersCount || 0}`;

  const promptText = `You are a distinguished academic research mentor and computer science / university professor.
Generate a structured, step-by-step, week-by-week research roadmap over a duration of ${duration} weeks for the following student research project:

Project Title: "${options.projectTitle}"
${domainStr}
${abstractStr}

CURRENT PROJECT REAL-TIME CONTEXT:
- ${progressStr}
- ${worksStr}
- ${reviewStr}
- ${papersStr}

CRITICAL CONTEXT ADAPTATION INSTRUCTIONS:
1. IF Has Written Research Paper is YES OR Faculty Supervisor Review Status is "Pending Review" / "Reviewed" OR Progress is >= 70%:
   The student has ALREADY written or drafted their Research Paper and is in the advanced review/finalization phase!
   Do NOT generate a generic "Week 1: Collect 20 papers" starting roadmap.
   Instead, generate an Advanced Finalization & Publication Roadmap:
   - Week 1: Audit manuscript citations, verify methodology against current paper draft, address pre-review notes.
   - Week 2: Address supervisor review comments & incorporate faculty feedback into the manuscript.
   - Week 3: Conduct ablation studies, parameter sensitivity checks, or dataset edge-case validations.
   - Week 4+: Refine high-resolution figures, prepare camera-ready formatting, and draft defense slides or journal submission.
2. IF Progress is 35% - 69% OR Research Work Documents exist (e.g. Literature Review):
   Generate an Intermediate Execution & Experimentation Roadmap focusing on algorithm design, experimental benchmarks, and writing results sections.
3. IF Progress is < 35% AND Has Written Research Paper is NO:
   Generate a Foundational Roadmap starting with literature survey, problem formulation, and architecture design.

The roadmap MUST span exactly ${duration} weeks, numbered 1 to ${duration}.
Provide realistic, actionable academic research steps tailored specifically to this project's topic and current progress stage.

Return ONLY a valid JSON object matching this exact schema:
{
  "durationWeeks": ${duration},
  "roadmap": [
    {
      "week": 1,
      "title": "Short Descriptive Week Title Tailored to Current Project Phase",
      "objective": "High-level goal for this week.",
      "tasks": [
        "Actionable task item 1",
        "Actionable task item 2",
        "Actionable task item 3"
      ],
      "deliverable": "Tangible deliverable for the week",
      "mentorTip": "Practical research tip or advice for the student for this phase"
    }
  ]
}

CRITICAL RULES:
1. Ensure the tasks are highly specific to "${options.projectTitle}".
2. Each week MUST contain 2 to 4 concrete actionable tasks.
3. Respect the student's actual project stage as specified above.
4. Do NOT include markdown code fences or conversational text outside the JSON object.`;

  let availableModels: string[] = [];
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (listRes.ok) {
      const listData = await listRes.json();
      if (listData && Array.isArray(listData.models)) {
        availableModels = listData.models
          .filter((m: any) => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
          .map((m: any) => m.name.replace(/^models\//, ""));
      }
    }
  } catch {}

  const fallbackList = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash"];
  const candidateModels = [...new Set([...availableModels, ...fallbackList])].filter((m) => m !== "gemini-pro");
  let lastError = "";

  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const candidate = data.candidates?.[0];
        const rawText = candidate?.content?.parts?.[0]?.text;

        if (rawText) {
          let jsonStr = rawText.trim();
          if (jsonStr.startsWith("```json")) {
            jsonStr = jsonStr.replace(/^```json/, "").replace(/```$/, "").trim();
          } else if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.replace(/^```/, "").replace(/```$/, "").trim();
          }

          const parsed = JSON.parse(jsonStr);

          if (Array.isArray(parsed.roadmap)) {
            const formattedRoadmap: ResearchRoadmapWeek[] = parsed.roadmap.map((w: any, idx: number) => ({
              week: Number(w.week) || idx + 1,
              title: String(w.title || `Week ${idx + 1} Phase`).trim(),
              objective: String(w.objective || "Complete weekly research milestones.").trim(),
              tasks: Array.isArray(w.tasks) ? w.tasks.map((t: any) => String(t).trim()).filter(Boolean) : [],
              deliverable: String(w.deliverable || "Weekly progress report").trim(),
              mentorTip: w.mentorTip ? String(w.mentorTip).trim() : undefined,
            }));

            return {
              success: true,
              durationWeeks: duration,
              roadmap: formattedRoadmap,
              modelUsed: model,
            };
          }
        }
      } else {
        const errBody = await res.text();
        const sanitizedErr = errBody.replace(new RegExp(apiKey, "g"), "[REDACTED_API_KEY]");
        lastError = `HTTP ${res.status} (${model}): ${sanitizedErr}`;
      }
    } catch (e: any) {
      const msg = e?.name === "AbortError" ? "Request timed out after 60s" : e?.message || String(e);
      const sanitizedErr = msg.replace(new RegExp(apiKey, "g"), "[REDACTED_API_KEY]");
      lastError = `Error (${model}): ${sanitizedErr}`;
    }
  }

  return {
    success: false,
    error: lastError || "Failed to generate research roadmap using Gemini AI models.",
  };
}

/**
 * Generates AI writing assistance for a specific section of a student's research document.
 */
export async function generateWritingAssistWithGemini(options: {
  action: string;
  content: string;
  sectionTitle?: string;
  documentType?: string;
  workTitle?: string;
  documentAbstract?: string;
  documentSections?: { title: string; contentSnippet: string }[];
  projectTitle?: string;
  domain?: string;
  projectAbstract?: string;
  literatureContext?: string[];
}): Promise<{ success: boolean; suggestion?: string; modelUsed?: string; error?: string }> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: "GEMINI_API_KEY environment variable is missing on the server.",
    };
  }

  const docType = options.documentType || "Research Paper";
  const sTitle = options.sectionTitle || "Research Section";
  const pTitle = options.projectTitle || "Academic Research Project";
  const domain = options.domain || "Computer Science / Academic Field";
  const wTitle = options.workTitle || "Research Document";
  const pAbstract = options.projectAbstract || "";
  const docAbstract = options.documentAbstract || "";
  const existingContent = options.content ? options.content.trim() : "";
  const isOutline =
    options.action === "generate_outline" ||
    options.action === "structure_literature" ||
    options.action === "structure_methodology" ||
    options.action === "identify_themes";

  const isResultsSection = /result|finding|experiment|evaluation|performance/i.test(sTitle);
  const isMethodologySection = /method|architecture|approach|proposed|implementation|design|framework/i.test(sTitle);
  const isAbstractSection = sTitle.toLowerCase() === "abstract" || options.action === "generate_abstract";

  // 1. DETERMINISTIC EMPTY-SECTION HANDLING FOR RESULTS / EVALUATION SECTIONS
  if (isResultsSection && options.action !== "generate_outline") {
    const hasEmpiricalData = Boolean(
      existingContent &&
      /\d+(\.\d+)?%|\baccuracy\b|\bprecision\b|\brecall\b|\bf1\b|\btable\b|\bfigure\b|\bmeasured\b|\btested\b|\bdataset of\b/i.test(existingContent)
    );
    if (!hasEmpiricalData) {
      if (options.action === "elaborate_discussion") {
        return {
          success: true,
          suggestion: "There are no experimental results or empirical data available to interpret in this section.",
          modelUsed: "grounded-rule",
        };
      }
      return {
        success: true,
        suggestion: "There are no existing experimental results or empirical findings in this section to analyze or improve.",
        modelUsed: "grounded-rule",
      };
    }
  }

  // Generic empty section guard for rewrite actions
  if (options.action === "improve_writing" || options.action === "academic_tone") {
    if (!existingContent) {
      return {
        success: true,
        suggestion: "There is no existing section content to improve. Please provide initial draft content or select an outline action.",
        modelUsed: "grounded-rule",
      };
    }
  }

  if (options.action === "clarify_approach" && !existingContent && !pAbstract && !docAbstract) {
    return {
      success: true,
      suggestion: "Insufficient system pipeline details are available in the project context to clarify technical workflow steps without fabricating implementation stages.",
      modelUsed: "grounded-rule",
    };
  }

  // Document-type specific language & tense directives
  let docTypeGuidance = "";
  if (/proposal/i.test(docType)) {
    docTypeGuidance = `Document Type is a Research Proposal. Use proposal-appropriate, future-oriented language ("proposes", "aims to", "will utilize", "is designed to"). DO NOT claim completed experimental results, completed implementations, or invent accuracy rates.`;
  } else if (/conference/i.test(docType)) {
    docTypeGuidance = `Document Type is a Conference Paper. Use concise, high-impact conference-style academic prose based strictly on the provided content.`;
  } else if (/literature/i.test(docType)) {
    docTypeGuidance = `Document Type is a Literature Review. Synthesize the provided background and literature context logically. Do NOT invent empirical findings.`;
  } else {
    docTypeGuidance = `Document Type is a ${docType}. Use formal publishable academic prose based strictly on the provided content. Do NOT invent missing experimental findings.`;
  }

  let actionInstruction = "";
  if (options.action === "generate_abstract") {
    actionInstruction = `Write ONE single, polished, high-quality academic abstract as a single unified paragraph (approx 150-250 words) for the ${docType} titled "${wTitle}".
- Synthesize the research background, core objective, proposed methodology, and expected contribution into ONE coherent paragraph without breaking into multiple sections, bullet points, or multiple drafts.
- Rely strictly on the actual project and document details provided. DO NOT invent unmentioned datasets, algorithms, external statistics, or accuracy rates.
- Adapt tone to document type: ${docTypeGuidance}
- Do NOT include any section labels or headings (such as "Research Problem:", "Objective:", "Methodology:", "Key Findings:", or "Conclusion:").
- Do NOT include markdown bolding, asterisks, bullet points, multiple versions, or meta commentary.`;
  } else if (options.action === "expand_background") {
    actionInstruction = `Expand and enrich the research background and problem motivation for the "${sTitle}" section in the ${docType} titled "${wTitle}".
- Contextualize the problem within the broader scientific domain strictly based on the provided project context.
- DO NOT invent unverified facts, specific unmentioned benchmarks, or fabricated citations.
- Adapt tone to document type: ${docTypeGuidance}
- Return ONLY the improved scholarly background text.
- Do NOT include markdown bolding, asterisks, section headings, or meta commentary.`;
  } else if (options.action === "clarify_objectives") {
    actionInstruction = `Articulate and clarify the core research problem, objectives, and research questions for "${sTitle}" in the ${docType} titled "${wTitle}".
- Ensure clear, rigorous academic phrasing grounded strictly in the provided project scope.
- Adapt tone to document type: ${docTypeGuidance}
- Return ONLY the clear objectives and problem statement text.
- Do NOT include markdown bolding, asterisks, section headings, or meta commentary.`;
  } else if (options.action === "improve_synthesis") {
    actionInstruction = `Synthesize and improve the narrative flow of the literature review in "${sTitle}" for the ${docType} titled "${wTitle}".
- Connect related research threads and establish critical relationships strictly from the provided literature and project context without inventing non-existent citations or claims.
- Return ONLY the synthesized scholarly text block.
- Do NOT include markdown bolding, asterisks, section headings, or meta commentary.`;
  } else if (options.action === "identify_themes") {
    actionInstruction = `Identify and group core thematic areas, methodologies, and literature trends for "${sTitle}" in the ${docType} titled "${wTitle}".
- Return ONLY a clean, structured bulleted list of thematic groupings based strictly on the provided context.
- Do NOT include meta commentary or introductory filler.`;
  } else if (options.action === "structure_literature") {
    actionInstruction = `Structure the literature review outline and explicitly highlight research gaps for "${sTitle}" in the ${docType} titled "${wTitle}".
- Return ONLY a structured bulleted outline with key themes and gap analyses grounded in provided context.
- Do NOT include meta commentary or introductory filler.`;
  } else if (options.action === "improve_methodology") {
    actionInstruction = `Refine and improve the technical explanation and procedural rigor for "${sTitle}" in the ${docType} titled "${wTitle}".
- STRICT GROUNDING: Elaborate only upon the confirmed methodology explicitly provided. DO NOT invent or assume unmentioned implementation details such as data augmentation, normalization, class balancing, specific unnamed datasets, specific model layer counts/architectures, optimizers, knowledge bases, or experimental accuracy figures.
- Adapt tone to document type: ${docTypeGuidance}
- Return ONLY the improved methodology text.
- Do NOT include markdown bolding, asterisks, section headings, or meta commentary.`;
  } else if (options.action === "clarify_approach") {
    actionInstruction = `Clarify the step-by-step technical approach and system workflow for "${sTitle}" in the ${docType} titled "${wTitle}".
- STRICT GROUNDING: Structure and explain the confirmed workflow steps logically without introducing unmentioned pipeline stages, data preprocessing techniques, or algorithms.
- Return ONLY the clarified technical text.
- Do NOT include markdown bolding, asterisks, section headings, or meta commentary.`;
  } else if (options.action === "structure_methodology") {
    actionInstruction = `Generate a structured methodology framework outline for "${sTitle}" in the ${docType} titled "${wTitle}".
- Return ONLY a clean bulleted outline of the confirmed technical phases and methods.
- Do NOT include meta commentary or introductory filler.`;
  } else if (options.action === "improve_results_presentation") {
    actionInstruction = `Improve the scholarly presentation and academic discussion of findings for "${sTitle}" in the ${docType} titled "${wTitle}".
- STRICT GROUNDING: Ground all discussion strictly in the provided content. DO NOT invent, fabricate, or assume experimental accuracy rates, precision/recall figures, or new results.
- If empirical data is present, interpret only that specific data.
- Return ONLY the improved results presentation text.
- Do NOT include markdown bolding, asterisks, section headings, or meta commentary.`;
  } else if (options.action === "elaborate_discussion") {
    actionInstruction = `Deepen the academic discussion, implications, and analytical significance for "${sTitle}" in the ${docType} titled "${wTitle}".
- Ground all discussion strictly in provided project context without inventing non-existent metrics or external experimental validations.
- Return ONLY the polished discussion text.
- Do NOT include markdown bolding, asterisks, section headings, or meta commentary.`;
  } else if (options.action === "clarify_significance") {
    actionInstruction = `Articulate the broader academic and practical significance for "${sTitle}" in the ${docType} titled "${wTitle}".
- Return ONLY the refined scholarly text block grounded in the stated project purpose.
- Do NOT include markdown bolding, asterisks, section headings, or meta commentary.`;
  } else if (options.action === "improve_conclusion") {
    actionInstruction = `Write a polished, conclusive synthesis summarizing the contributions and closing insights for "${sTitle}" in the ${docType} titled "${wTitle}".
    - Synthesize the work's primary impact cleanly based strictly on the provided research scope.
    - Return ONLY the improved conclusion text.
    - Do NOT include markdown bolding, asterisks, section headings, or meta commentary.`;
  } else if (options.action === "summarize_contributions") {
    actionInstruction = `Synthesize and summarize the core research contributions for "${sTitle}" in the ${docType} titled "${wTitle}".
- Return ONLY the concise contributions summary text without fabricating unmentioned findings.
- Do NOT include markdown bolding, asterisks, section headings, or meta commentary.`;
  } else if (options.action === "refine_future_work") {
    actionInstruction = `Articulate promising future research directions, open challenges, and prospective extensions for "${sTitle}" in the ${docType} titled "${wTitle}".
- Return ONLY the refined future work text.
- Do NOT include markdown bolding, asterisks, section headings, or meta commentary.`;
  } else if (options.action === "format_references") {
    actionInstruction = `Format and standardize the reference citations in "${sTitle}" to standard academic style (consistent APA or IEEE format).
- Preserve all existing citation details. Do not invent fake DOIs, titles, or authors.
- Return ONLY the formatted reference list text.
- Do NOT include meta commentary or introductory filler.`;
  } else if (options.action === "improve_writing" || options.action === "academic_tone") {
    if (isAbstractSection) {
      actionInstruction = `Improve and polish the academic writing and clarity of the supplied abstract for the ${docType} titled "${wTitle}".
- CRITICAL RULE: Improve ONLY the supplied abstract content and preserve its exact factual meaning and scope.
- ABSOLUTELY DO NOT replace it with a newly researched or generated abstract based on external general knowledge.
- ABSOLUTELY DO NOT introduce external statistics, domain loss figures (such as "20–40% of crops are lost annually"), unmentioned citations, external datasets, specific layer architectures, leaf color/texture claims, or experimental performance metrics that are not explicitly present in the supplied abstract.
- Ensure the output is ONE unified, coherent academic paragraph (no headings, no labels like "Research Problem:", "Objective:", etc., no bullet points, no markdown bolding, no meta-commentary).
- Use proposal/development-stage language if the existing abstract describes a proposed or developing system.
- Return ONLY the polished single-paragraph abstract.`;
    } else {
      actionInstruction = `Rewrite and polish the provided section text for "${sTitle}" in the ${docType} titled "${wTitle}".
- CRITICAL RULE: Improve ONLY the provided text and preserve its exact factual meaning and technical scope.
- ABSOLUTELY DO NOT introduce external statistics, percentages, unmentioned datasets, or fabricated claims not present in the supplied text.
- Adapt tone to document type: ${docTypeGuidance}
- Return ONLY the improved scholarly text block.
- Preserve all existing technical facts without inventing fabricated metrics or unsupported claims.
- Do NOT include markdown bolding, asterisks, bullet points, section headings, or meta commentary.`;
    }
  } else if (options.action === "expand_section") {
    if (isMethodologySection && !existingContent) {
      actionInstruction = `Provide a high-level conceptual proposed methodology draft for "${sTitle}" in the ${docType} titled "${wTitle}" based ONLY on confirmed project facts.
- STRICT GROUNDING: Stay strictly at the confirmed conceptual level (e.g., uploaded plant leaf images → deep learning / CNN-based disease classification → disease diagnostic information → actionable preventive guidance → early detection and agricultural decision support).
- ABSOLUTELY DO NOT invent procedural stages or technical pipeline steps such as preprocessing, image normalization, data augmentation, feature extraction layers, filtering operations, dataset preparation, cross-validation, optimizers, loss functions, model backbones, or hardware unless explicitly named in the context.
- Use strictly proposal/development-stage language such as "the proposed system", "will utilize", "aims to", "is designed to", and "the proposed framework".
- The output must clearly remain a proposed conceptual framework, NOT a claim about completed implementation or an invented technical pipeline.
- Adapt tone to document type: ${docTypeGuidance}
- Return ONLY the proposed conceptual methodology text block.
- Do NOT include markdown bolding, asterisks, bullet points, section headings, or meta commentary.`;
    } else if (isMethodologySection && existingContent) {
      actionInstruction = `Elaborate upon the student's existing methodology in "${sTitle}" for the ${docType} titled "${wTitle}" with academic depth and rigorous prose.
- STRICT GROUNDING: Expand ONLY the confirmed methodology and concepts explicitly provided in the student's existing text and project context.
- ABSOLUTELY DO NOT INVENT or assume implementation details or unmentioned procedural stages (such as preprocessing, normalization, filtering operations, feature extraction layers, augmentation, class balancing, specific unnamed datasets, specific model architectures/layers like ResNet or U-Net unless named, optimizers, loss functions, hardware, or experimental accuracy metrics).
- Adapt tone to document type: ${docTypeGuidance}
- Return ONLY the expanded academic text.
- Do NOT include markdown bolding, asterisks, bullet points, section headings, or meta commentary.`;
    } else {
      actionInstruction = `Elaborate upon the section "${sTitle}" in the ${docType} titled "${wTitle}" with academic depth and rigorous prose.
- STRICT GROUNDING: Elaborate ONLY upon the confirmed concepts explicitly provided in the student's text and project context.
- ABSOLUTELY DO NOT INVENT or assume implementation details (such as data augmentation, normalization, class balancing, specific unnamed datasets, specific model architectures/layers unless named, optimizers, hardware, or experimental accuracy metrics).
- If the section is empty, describe only the high-level confirmed research concept from the project scope using proposal/development-stage language rather than fabricating specific pipeline choices.
- Adapt tone to document type: ${docTypeGuidance}
- Return ONLY the expanded academic text.
- Do NOT include markdown bolding, asterisks, bullet points, section headings, or meta commentary.`;
    }
  } else if (options.action === "generate_outline") {
    if (isResultsSection) {
      actionInstruction = `Generate a structured outline of proposed evaluation categories for "${sTitle}" in the ${docType} titled "${wTitle}".
- Clearly frame evaluation items as suggested/planned possibilities directly relevant to the project (e.g., Proposed Evaluation of Classification Accuracy, Potential Evaluation Metrics, Planned Assessment of Diagnostic Performance, Proposed Error and Misclassification Review, Verification of Practical Usability).
- DO NOT automatically introduce specific unmentioned experimental techniques such as cross-validation, confusion-matrix analysis, baseline model comparisons, or statistical significance testing unless already specified in the Research Work context.
- DO NOT claim that the project has committed to specific implementation decisions, and NEVER fabricate accuracy numbers or completed results.
- Return ONLY a clean bulleted outline.
- Do NOT include meta commentary or introductory filler.`;
    } else {
      actionInstruction = `Generate a structured section outline with key technical points for "${sTitle}" in the ${docType} titled "${wTitle}".
- Return ONLY the clean bulleted outline.
- Do NOT include meta commentary or introductory filler.`;
    }
  } else {
    actionInstruction = `Refine and polish the academic text for "${sTitle}" to publication standard strictly based on provided context. Do NOT include markdown, headings, or meta commentary.`;
  }

  const literatureStr =
    options.literatureContext && options.literatureContext.length > 0
      ? `RELEVANT PROJECT LITERATURE CONTEXT:\n${options.literatureContext.join("\n\n")}\n\n`
      : "";

  let docSectionsStr = "";
  if (options.documentSections && options.documentSections.length > 0) {
    docSectionsStr =
      `CURRENT WORK DOCUMENT SECTIONS CONTEXT:\n` +
      options.documentSections.map((s) => `• ${s.title}: ${s.contentSnippet}`).join("\n") +
      "\n\n";
  }

  const systemInstructions = `You are a professional academic manuscript editor and text generator.
STRICT MANDATORY OUTPUT CONSTRAINTS:
1. OUTPUT ONLY THE FINAL REQUESTED TEXT FOR THE SELECTED SECTION ("${sTitle}").
2. STRICT GROUNDING & ZERO-FABRICATION RULE:
   - Use ONLY the technical components, architectures, datasets, and methods explicitly present in the provided context.
   - ABSOLUTELY NEVER INVENT or assume implementation details or external statistics that are not provided, such as:
     * External statistics, estimates, or domain figures (e.g. agricultural crop loss percentages such as "20–40%", disease prevalence stats) unless explicitly in the input text
     * Procedural pipeline stages (e.g. preprocessing, normalization, filtering operations, feature extraction layers, cross-validation) unless explicitly named
     * Data augmentation techniques (e.g. rotation, shearing, flipping, zooming)
     * Image normalization, scaling, or color space transformations
     * Class balancing techniques (e.g. SMOTE, oversampling, class weighting)
     * Specific unnamed datasets or benchmarks (e.g. PlantVillage, ImageNet, COCO)
     * Specific model backbones or layer counts (e.g. ResNet, VGG, MobileNet, U-Net) unless explicitly named by the student
     * Specific optimizers, learning rates, epochs, or loss functions (e.g. Adam, SGD, Cross-Entropy)
     * Knowledge bases, ontologies, or expert systems
     * Experimental results, accuracy figures, precision/recall percentages, or validation metrics
     * Completed system performance claims when the work is in proposed or development stage
   - If technical specifics are missing from the student's text, elaborate solely on the confirmed methodology and procedural principles at a formal academic level without inventing extra pipeline techniques or fabricated numbers.
3. ABSOLUTELY NEVER OUTPUT:
   - System/prompt instructions or repetition of the task
   - Reasoning, chain-of-thought, internal logic, or self-correction
   - Drafting process, word-count checks, planning notes, or checklist verifications
   - Labels such as "Final Draft", "Refined Draft", "Opening", "Methodology", "Conclusion", "Research Problem:", "Objective:" unless part of a requested outline format
   - Multiple versions, options, or alternative drafts
   - Meta-commentary or explanations of what you wrote
   - Notes or explanations about the prompt
4. NO MARKDOWN (no **, #, *, _) and NO SECTION LABELS (no "Research Problem:", "Objective:", etc.) unless generating a bulleted outline.
5. TENSE & STAGE ADAPTATION: ${docTypeGuidance}`;

  const userPrompt = `TASK:
${actionInstruction}

CURRENT SELECTED WORK CONTEXT:
- Document Type: ${docType}
- Document Title: "${wTitle}"
${docAbstract ? `- Document Abstract: ${docAbstract}\n` : ""}${docSectionsStr}PARENT PROJECT CONTEXT:
- Project Title: "${pTitle}"
- Research Domain: ${domain}
${pAbstract ? `- Project Abstract/Description: ${pAbstract}\n` : ""}
${literatureStr}SELECTED SECTION TO ASSIST:
- Section Title: "${sTitle}"
- Existing Content: ${existingContent ? `"${existingContent}"` : "(Section is currently empty. Generate the initial text.)"}`;

  let availableModels: string[] = [];
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (listRes.ok) {
      const listData = await listRes.json();
      if (listData && Array.isArray(listData.models)) {
        availableModels = listData.models
          .filter((m: any) => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
          .map((m: any) => m.name.replace(/^models\//, ""));
      }
    }
  } catch {}

  const priorityModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-2.5-pro", "gemini-1.5-pro"];
  const candidateModels = [...new Set([...priorityModels, ...availableModels])].filter((m) => m !== "gemini-pro" && !m.includes("embedding"));
  let lastError = "";

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(12000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstructions }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.1,
          },
        }),
      });

      let rawText = "";
      if (res.ok) {
        const data = await res.json();
        rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else {
        // Fallback without systemInstruction
        const fallbackRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(12000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemInstructions}\n\n${userPrompt}` }] }],
            generationConfig: { temperature: 0.1 },
          }),
        });

        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          rawText = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } else {
          const errBody = await res.text();
          const sanitizedErr = errBody.replace(new RegExp(apiKey, "g"), "[REDACTED_API_KEY]");
          lastError = `HTTP ${res.status} (${model}): ${sanitizedErr}`;
          continue;
        }
      }

      if (rawText) {
        let text = rawText.trim();

        // 1. Remove code blocks
        text = text.replace(/^```[a-z]*\n?/gi, "").replace(/\n?```$/gi, "").trim();

        // 2. Look for explicit final text markers produced by chain-of-thought models
        const finalMarkerRegex = /(?:Final Text Construction|Final Text|Final Polish|Final Version|Final Draft|Self-Correction during final check.*?Text|Text):\s*([\s\S]+)$/i;
        const markerMatch = text.match(finalMarkerRegex);
        if (markerMatch && markerMatch[1] && markerMatch[1].trim().length > 30) {
          text = markerMatch[1].trim();
        }

        // 3. Remove wrapping quotes
        if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
          text = text.slice(1, -1).trim();
        }

        // 4. Strip lines with reasoning / meta-thinking / prompt headers / word counts / check notes
        const lines = text.split("\n");
        const cleanLines = lines.filter((line: string) => {
          const trimmed = line.trim();
          if (!trimmed) return true;
          if (/\?\s*Yes\.?$/i.test(trimmed)) return false;
          if (
            /^(?:\*\s*)?(?:Final check|One more check|One last check|Check on|The user said|The prompt says|Self-Correction|Check constraints|Final Polish)/i.test(
              trimmed
            )
          ) {
            return false;
          }
          if (
            /^(?:Task|Constraints|Title:|Current Content:|Output ONLY|No markdown|No section labels|No meta-commentary|No fabricated|Tone:|Broad context:|Problem:|Solution\/Trend:|Specific focus:|Refining|Draft|Word Count|Word count|Markdown Check|Content Check|Double check|One detail|Check for|Wait,|Ready\.?|The text is ready|Final Text Construction|Final Text|Background|Objective|Methodology|Key Findings|Conclusion|Reasoning|Meta|Internal note|Output Rules|Document Type|Expansion strategy|Revision strategy)/i.test(
              trimmed
            )
          ) {
            return false;
          }
          if (/(?:Draft\s*\d|Refining\s+for|Mental\s+Draft)/i.test(trimmed)) {
            return false;
          }
          if (
            /^(?:Here is|Below is|Sure,|Certainly,|As requested,|Final Draft|Refined Draft|Draft 1|Draft 2|Option 1|Option 2|Revised Draft|Text:)/i.test(
              trimmed
            ) &&
            lines.length > 1
          ) {
            return false;
          }
          if (!isOutline && /^\s*[\*\-]\s+/i.test(trimmed)) {
            return false;
          }
          if (/\(Word count:\s*\d+/i.test(trimmed) || /words\.\s*I need to expand/i.test(trimmed)) {
            return false;
          }
          return true;
        });

        // 5. If multiple paragraphs exist and the first is an isolated headline without verbs, filter it
        const rawParagraphs = cleanLines.join("\n").split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
        const uniqueParagraphs: string[] = [];
        for (const p of rawParagraphs) {
          if (!uniqueParagraphs.includes(p)) {
            uniqueParagraphs.push(p);
          }
        }

        // If first paragraph is a short headline (e.g. "Global food security...") and there is a longer main paragraph
        if (uniqueParagraphs.length > 1 && uniqueParagraphs[0].split(/\s+/).length < 12 && !uniqueParagraphs[0].endsWith(".")) {
          uniqueParagraphs.shift();
        }

        text = uniqueParagraphs.join("\n\n").trim();

        // 6. If NOT outline, strip markdown bolding, section labels, and headers
        if (!isOutline) {
          // Strip section labels like "Research Problem:", "Objective:", "Methodology:", "Key Findings:", "Conclusion:"
          text = text.replace(
            /(?:^\s*|\n\s*)(?:\*\s*)?(?:\*\*)?(?:Research Problem|Problem Statement|Objective|Methodology|Proposed System|Key Findings|Projected Results|Expected Results|Conclusion)(?:\*\*)?:\s*/gi,
            " "
          );

          // Strip markdown asterisks (**text** -> text, *text* -> text)
          text = text.replace(/\*\*(.*?)\*\*/g, "$1");
          text = text.replace(/\*(.*?)\*/g, "$1");
          text = text.replace(/^#{1,6}\s+/gm, "");
          text = text.replace(/[ \t]{2,}/g, " ");
          text = text.replace(/\n{3,}/g, "\n\n");
        }

        return {
          success: true,
          suggestion: text.trim(),
          modelUsed: model,
        };
      }
    } catch (e: any) {
      const msg = e?.message || String(e);
      const sanitizedErr = msg.replace(new RegExp(apiKey, "g"), "[REDACTED_API_KEY]");
      lastError = `Error (${model}): ${sanitizedErr}`;
    }
  }

  return {
    success: false,
    error: lastError || "Failed to generate AI writing suggestion.",
  };
}

export interface MentionedPaperContext {
  id: string;
  title: string;
  authors?: string;
  year?: string;
  journal?: string;
  doi?: string;
  abstract?: string;
  keywords?: string[];
  url?: string;
  aiSummary?: any;
}

/**
 * Generates answers for the AI Research Assistant, incorporating project context & @-mentioned paper context.
 */
export async function generateAssistantChatWithGemini(options: {
  userQuestion: string;
  history?: { role: "user" | "assistant"; content: string }[];
  projectContext?: {
    title?: string;
    domain?: string;
    abstract?: string;
    status?: string;
    progress?: number;
    activeWorkDocTitle?: string;
    activeWorkDocSections?: { title: string; contentSnippet: string }[];
  };
  mentionedPapers?: MentionedPaperContext[];
  allProjectPapersSummary?: { id: string; title: string; year?: string; journal?: string; abstractSnippet?: string }[];
}): Promise<{ success: boolean; response?: string; modelUsed?: string; error?: string }> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: "GEMINI_API_KEY environment variable is missing on the server.",
    };
  }

  const pCtx = options.projectContext;
  const projectHeader = pCtx
    ? `CURRENT STUDENT PROJECT CONTEXT:
- Title: "${pCtx.title || "Academic Research Project"}"
- Domain: ${pCtx.domain || "General Science & Technology"}
${pCtx.abstract ? `- Project Abstract: ${pCtx.abstract}\n` : ""}- Project Status: ${pCtx.status || "In Progress"} (${pCtx.progress || 0}% complete)
${pCtx.activeWorkDocTitle ? `- Current Active Document: "${pCtx.activeWorkDocTitle}"\n` : ""}`
    : `NO SPECIFIC PROJECT SELECTED. Answer as a general academic research assistant co-pilot.`;

  let workDocDetails = "";
  if (pCtx?.activeWorkDocSections && pCtx.activeWorkDocSections.length > 0) {
    workDocDetails =
      `CURRENT RESEARCH DOCUMENT DRAFT SECTIONS:\n` +
      pCtx.activeWorkDocSections.map((s) => `• ${s.title}:\n${s.contentSnippet}`).join("\n\n") +
      "\n\n";
  }

  let mentionedPapersSection = "";
  if (options.mentionedPapers && options.mentionedPapers.length > 0) {
    mentionedPapersSection =
      `SPECIFICALLY MENTIONED PAPERS (@ PAPERS CONTEXT):\n` +
      options.mentionedPapers
        .map((p) => {
          let text = `=== MENTIONED PAPER: "${p.title}" ===\n`;
          if (p.authors) text += `Authors: ${p.authors}\n`;
          if (p.year) text += `Year: ${p.year}\n`;
          if (p.journal) text += `Journal/Venue: ${p.journal}\n`;
          if (p.doi) text += `DOI: ${p.doi}\n`;
          if (p.url) text += `URL: ${p.url}\n`;
          if (p.abstract) text += `Abstract: ${p.abstract}\n`;
          if (p.keywords && p.keywords.length > 0) text += `Keywords: ${p.keywords.join(", ")}\n`;
          if (p.aiSummary) {
            text += `Stored AI Summary:\n`;
            if (p.aiSummary.overview) text += `  - Overview: ${p.aiSummary.overview}\n`;
            if (p.aiSummary.researchObjective) text += `  - Objective: ${p.aiSummary.researchObjective}\n`;
            if (p.aiSummary.problemStatement) text += `  - Problem Statement: ${p.aiSummary.problemStatement}\n`;
            if (p.aiSummary.methodology) text += `  - Methodology: ${p.aiSummary.methodology}\n`;
            if (p.aiSummary.dataset) text += `  - Dataset: ${p.aiSummary.dataset}\n`;
            if (p.aiSummary.algorithms) text += `  - Algorithms/Models: ${p.aiSummary.algorithms}\n`;
            if (p.aiSummary.keyFindings) text += `  - Key Findings: ${p.aiSummary.keyFindings}\n`;
            if (p.aiSummary.advantages) text += `  - Advantages: ${p.aiSummary.advantages}\n`;
            if (p.aiSummary.limitations) text += `  - Limitations: ${p.aiSummary.limitations}\n`;
            if (p.aiSummary.futureWork) text += `  - Future Work: ${p.aiSummary.futureWork}\n`;
            if (p.aiSummary.keyTakeaway) text += `  - Key Takeaway: ${p.aiSummary.keyTakeaway}\n`;
          }
          return text;
        })
        .join("\n\n") +
      "\n\n";
  }

  let allPapersSection = "";
  if (options.allProjectPapersSummary && options.allProjectPapersSummary.length > 0) {
    allPapersSection =
      `PROJECT REFERENCE PAPERS LIBRARY (${options.allProjectPapersSummary.length} papers available in project):\n` +
      options.allProjectPapersSummary
        .map((p) => `• "${p.title}" (${p.year || "N/A"} - ${p.journal || "Literature"}): ${p.abstractSnippet || "No abstract available"}`)
        .join("\n") +
      "\n\n";
  }

  const systemInstructions = `You are ScholarNexus AI Research Assistant — an advanced academic co-pilot and literature synthesis assistant for university students and researchers.

${projectHeader}
${workDocDetails}${mentionedPapersSection}${allPapersSection}
STRICT GROUNDING & CONTEXT RULES:
1. MENTIONED PAPERS (@ PAPERS):
   - When one or more papers are explicitly mentioned (@), PRIORITIZE them as your primary reference context.
   - Ground all paper-specific answers strictly in the available paper information provided above (Title, Authors, Year, Venue, Abstract, Keywords, and Stored AI Summary).
   - ANSWER SPECIFICITY & HIGH RELEVANCE: Answer ONLY what the user asks. Keep your answer concise, direct, and tightly focused on the specific aspect requested:
     • If asked about **Methodology / Architecture**: Focus strictly on the methodology, models, algorithms, and techniques used. Do NOT include unrelated accuracy metrics, dataset stats, or broad summary overviews.
     • If asked about **Objective / Purpose**: Focus strictly on the problem statement and research objective. Do NOT dump the full methodology or results.
     • If asked about **Dataset**: Focus strictly on the dataset characteristics, sample size, or data sources.
     • If asked about **Findings / Results**: Focus strictly on key findings and conclusions.
     • If asked about **Limitations / Future Work**: Focus strictly on the stated limitations and future directions.
   - If the stored paper information does NOT contain sufficient detail to answer a specific question (e.g. exact training hardware, specific hyperparameter values, or datasets not stated in stored data), CLEARLY state: "The stored information for [Paper Title] does not specify [missing details]." Do NOT hallucinate, guess, or invent non-existent details.
   - If multiple papers are mentioned (e.g., comparing methodologies or limitations), present a clear, structured comparison explicitly distinguishing between each paper.
2. GENERAL RESEARCH QUESTIONS:
   - When no specific @ paper is mentioned, use the overall project context, draft research document, and reference library to answer methodology questions, explain concepts, highlight research gaps, and suggest project improvements.
3. DIRECT ANSWER ONLY & NATURAL ACADEMIC PHRASING (CRITICAL):
   - Output ONLY the direct, helpful, user-facing answer in natural, professional academic prose.
   - DO NOT use system-like prefixes or status headers such as "Methodology details available:", "Objective details available:", "Dataset details available:", "Results details available:", "Limitations details available:", etc.
   - DO NOT repeat or quote the user's question.
   - DO NOT echo the context, project title, or available information headers (e.g. NEVER write "* User Question:", "* Context:", "* Available Information:", "* Project Title:").
   - NEVER output internal reasoning, planning steps, constraint checks, draft iterations, self-corrections, or meta-commentary (such as "* Target Paper:", "* Constraint Check:", "* Drafting the response:", "* Self-Correction during drafting:", "* Final Plan:").
   - Use clear, well-structured GitHub-flavored Markdown formatting.`;

  // Helper to clean chain-of-thought from assistant responses
  const cleanAssistantResponse = (raw: string): string => {
    let text = raw.trim();
    text = text.replace(/^```markdown\n?/gi, "").replace(/\n?```$/gi, "").trim();

    // 1. If there is an explicit Final Answer/Polish marker near the end, extract it
    const lastFinalMatch = text.match(
      /(?:(?:\*|_)?(?:Final Answer|Final Response|Final Output|Refined Response Structure|Final Response Construction|Final Polish|Final Text)(?:\*|_)?):\s*([\s\S]+)$/i
    );
    if (lastFinalMatch && lastFinalMatch[1] && lastFinalMatch[1].trim().length > 10) {
      text = lastFinalMatch[1].trim();
    }

    // 2. Check if the output starts with a reasoning/scratchpad block (e.g. * Goal:, * Task:, * Role:, etc.)
    if (/^\s*\*\s*(?:Goal:|Task:|Role:|User Question:|Context:|Available Information:|Constraint:)/i.test(text)) {
      const paragraphs = text.split(/\n\s*\n/);
      const realParagraphs: string[] = [];
      let passedScratchpad = false;
      for (const p of paragraphs) {
        const trimmed = p.trim();
        if (!passedScratchpad) {
          if (
            /^\s*\*\s*(?:Goal|Task|Role|User Question|Context|Available Information|Constraint|Direct answer|No repetition|Use Markdown|Markdown used|\*)/i.test(trimmed) ||
            trimmed.split("\n").every((line: string) => /^\s*[\*\-]\s+/.test(line))
          ) {
            continue; // skip scratchpad paragraph
          }
          passedScratchpad = true;
        }
        realParagraphs.push(trimmed);
      }
      if (realParagraphs.length > 0) {
        text = realParagraphs.join("\n\n").trim();
      }
    }

    // 3. Filter out any remaining meta-thinking, echoes of question/context, role notes, or self-debate lines
    const lines = text.split("\n");
    const filteredLines = lines.filter((l: string) => {
      const trimmed = l.trim();
      if (!trimmed) return true;
      // Strip lines ending with constraint checks like "? Yes." or "? No."
      if (/\?\s*(?:Yes|No)\.?$/i.test(trimmed)) return false;
      if (
        /^(?:\*\s*)?(?:Goal:|Role:|User Question|Target Paper|Question:|Context:|Available Information|Project Title|Constraint|Constraint Check|Self-Correction|Observation:|Check:|Decision:|Refined Plan:|Final Decision:|Actually|Wait|Instruction:|Drafting the response|Draft \d|Mental Draft|Reasoning Steps|Internal note|Final check|Double check|However|Therefore|Let's try|Alternative interpretation|Acknowledge|Instruct|Maintain|Since no|I must inform|Direct answer only|No repetition of question|Use Markdown)/i.test(
          trimmed
        )
      ) {
        return false;
      }
      if (
        /^(?:\*\s*)?\*.*?(?:Wait|Correction|Decision|Check|Actually|Instruction|Plan|Thinking|Prompt|Grounding|Scenario|Assume|Disclaimer|Meta|Reasoning|Mental|Task|Constraint)/i.test(
          trimmed
        )
      ) {
        return false;
      }
      if (
        /^(?:I will|Let's|This is the|Result:|Therefore,|Prompt:|There is no paper|Since no paper|If I try|If I say|If the user)/i.test(
          trimmed
        )
      ) {
        return false;
      }
      return true;
    });

    let resultText = filteredLines.join("\n").trim();
    // Strip wrapping quotes around the entire text block if present
    resultText = resultText.replace(/^\s*"(.*)"\s*$/s, "$1").trim();
    resultText = resultText.replace(/^\s*\*\s*"(.*)"\s*$/s, "$1").trim();
    // Remove isolated single asterisks on their own lines
    resultText = resultText.replace(/^\s*\*\s*$/gm, "").trim();

    // 4. Strip system-like prefixes (e.g. "Methodology details available:", "Objective details available:", etc.)
    resultText = resultText.replace(
      /^(?:(?:\*\*|\*|#+\s*)?(?:Methodology|Objective|Dataset|Results?|Findings|Limitations?|Future Work|Overview|Summary)\s+details\s+(?:available|provided|found)(?:\*\*|\*)?:?\s*)/i,
      ""
    );

    return resultText.trim();
  };

  // Build contents array including chat history if present
  const contents: any[] = [];
  const systemPromptPart = { text: systemInstructions };

  if (Array.isArray(options.history) && options.history.length > 0) {
    // Add history items
    for (const h of options.history.slice(-6)) { // keep recent history
      contents.push({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }],
      });
    }
  }

  // Final user question (without artificial "Question:" prefix that causes echo)
  contents.push({
    role: "user",
    parts: [{ text: options.userQuestion }],
  });

  // Inject system prompt into first item or systemInstruction parameter
  let availableModels: string[] = [];
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (listRes.ok) {
      const listData = await listRes.json();
      if (listData && Array.isArray(listData.models)) {
        availableModels = listData.models
          .filter((m: any) => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
          .map((m: any) => m.name.replace(/^models\//, ""));
      }
    }
  } catch {}

  const priorityModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-2.5-pro", "gemini-1.5-pro"];
  const candidateModels = [...new Set([...priorityModels, ...availableModels])].filter((m) => m !== "gemini-pro" && !m.includes("embedding"));
  let lastError = "";

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(12000),
        body: JSON.stringify({
          systemInstruction: { parts: [systemPromptPart] },
          contents,
          generationConfig: {
            temperature: 0.2,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;

        if (text) {
          return {
            success: true,
            response: cleanAssistantResponse(text),
            modelUsed: model,
          };
        }
      } else {
        // Fallback without systemInstruction field if model doesn't support systemInstruction
        const fallbackContents = [
          { role: "user", parts: [{ text: `${systemInstructions}\n\nUser Question: ${options.userQuestion}` }] },
        ];
        const resFallback = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(12000),
          body: JSON.stringify({
            contents: fallbackContents,
            generationConfig: { temperature: 0.2 },
          }),
        });

        if (resFallback.ok) {
          const data = await resFallback.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return {
              success: true,
              response: cleanAssistantResponse(text),
              modelUsed: model,
            };
          }
        }

        const errBody = await res.text();
        const sanitizedErr = errBody.replace(new RegExp(apiKey, "g"), "[REDACTED_API_KEY]");
        lastError = `HTTP ${res.status} (${model}): ${sanitizedErr}`;
      }
    } catch (e: any) {
      const msg = e?.message || String(e);
      const sanitizedErr = msg.replace(new RegExp(apiKey, "g"), "[REDACTED_API_KEY]");
      lastError = `Error (${model}): ${sanitizedErr}`;
    }
  }

  return {
    success: false,
    error: lastError || "Failed to generate AI assistant response.",
  };
}


