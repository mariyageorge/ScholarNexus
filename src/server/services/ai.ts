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

  const promptText = `You are a distinguished academic research mentor and computer science / university professor.
Generate a structured, step-by-step, week-by-week research roadmap over a duration of ${duration} weeks for the following student research project:

Project Title: "${options.projectTitle}"
${domainStr}
${abstractStr}

The roadmap MUST span exactly ${duration} weeks, numbered 1 to ${duration}.
Provide realistic, actionable academic research steps tailored specifically to this project's topic.

Return ONLY a valid JSON object matching this exact schema:
{
  "durationWeeks": ${duration},
  "roadmap": [
    {
      "week": 1,
      "title": "Short Descriptive Week Title (e.g., Literature Collection & Survey)",
      "objective": "High-level goal for this week.",
      "tasks": [
        "Actionable task item 1 (e.g., Collect 20 peer-reviewed papers on ...)",
        "Actionable task item 2 (e.g., Filter papers by relevance and publication year)",
        "Actionable task item 3"
      ],
      "deliverable": "Tangible deliverable for the week (e.g., Initial literature database of 20 papers)",
      "mentorTip": "Practical research tip or advice for the student for this phase"
    }
  ]
}

CRITICAL RULES:
1. Ensure the tasks are highly specific to "${options.projectTitle}".
2. Each week MUST contain 2 to 4 concrete actionable tasks.
3. The progression must be logical: Literature survey -> Analysis & Gap Identification -> Methodology & System Design -> Implementation / Experimentation -> Evaluation -> Writing & Review.
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

