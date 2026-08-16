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

  const fallbackList = ["gemini-2.5-flash", "gemini-2.0-flash", "gemma-4-26b-a4b-it", "gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-pro"];
  const candidateModels = [...new Set([...availableModels, ...fallbackList])];

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
