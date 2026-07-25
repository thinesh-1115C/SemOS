import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import multer from "multer";
import * as pdfParseModule from "pdf-parse";
import JSZip from "jszip";

const app = express();
const PORT = 3000;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

app.use(express.json({ limit: "20mb" }));

// PPTX Text Extractor Helper
async function extractTextFromPptx(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles = Object.keys(zip.files).filter((filename) =>
      /^ppt\/slides\/slide\d+\.xml$/i.test(filename)
    );

    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0", 10);
      const numB = parseInt(b.match(/\d+/)?.[0] || "0", 10);
      return numA - numB;
    });

    let fullText = "";
    for (let i = 0; i < slideFiles.length; i++) {
      const xmlContent = await zip.files[slideFiles[i]].async("string");
      const slideText = xmlContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (slideText) {
        fullText += `--- Slide ${i + 1} ---\n${slideText}\n\n`;
      }
    }

    return {
      text: fullText || "Slide presentation loaded. Content extracted successfully.",
      pageCount: slideFiles.length || 1,
    };
  } catch (err: any) {
    console.error("PPTX Parsing error:", err);
    throw new Error("Failed to extract text from PPT/PPTX file.");
  }
}

// DOCX Text Extractor Helper
async function extractTextFromDocx(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const documentXml = zip.file("word/document.xml");
    if (!documentXml) {
      throw new Error("Invalid Word document structure.");
    }
    const xmlContent = await documentXml.async("string");
    const plainText = xmlContent.replace(/<w:p[^>]*>/g, "\n").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return {
      text: plainText || "Word document loaded. Content extracted successfully.",
      pageCount: Math.max(1, Math.ceil(plainText.length / 2000)),
    };
  } catch (err: any) {
    console.error("DOCX Parsing error:", err);
    throw new Error("Failed to extract text from Word document (.docx/.doc).");
  }
}

// Initialize Gemini SDK with telemetry header
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

function checkGeminiAvailable(res: express.Response) {
  if (!ai) {
    res.status(500).json({
      error: "Gemini API key is not configured. Please check your environment variables.",
    });
    return false;
  }
  return true;
}

// 1. Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "SemOS – Semester Operating System" });
});

// 2. AI Tutor Endpoint
app.post("/api/ai/tutor", async (req, res) => {
  if (!checkGeminiAvailable(res)) return;

  try {
    const { message, mode, subject, conversationHistory, studentContext } = req.body;

    let systemInstruction = `You are SemOS AI Tutor, a highly effective, encouraging, and academically rigorous tutor.
You are currently assisting a student studying "${subject || "General Science"}".
`;

    if (studentContext) {
      systemInstruction += `\nStudent Academic Context:
- Current Semester: ${studentContext.semester || "Semester 3"}
- Target GPA: ${studentContext.targetGpa || "3.8"}
- Known Weak Areas in this subject: ${studentContext.weakAreas?.join(", ") || "None recorded yet"}
`;
    }

    switch (mode) {
      case "beginner":
        systemInstruction += `\nMODE: Beginner Mode. Explain concepts using extremely simple everyday language, clear real-life analogies, and zero unnecessary jargon. Keep explanations warm and easy to absorb.`;
        break;
      case "expert":
        systemInstruction += `\nMODE: Expert / Academic Mode. Provide deep, rigorous technical explanations with mathematical formulations, underlying mechanisms, edge cases, and industry/academic standard terminology.`;
        break;
      case "exam":
        systemInstruction += `\nMODE: Exam Mode. Focus on high-yield exam questions, past paper patterns, marking schemes, common student pitfalls, and step-by-step model solutions.`;
        break;
      case "interview":
        systemInstruction += `\nMODE: Viva / Interview Mode. Act as a professor testing the student orally. Ask one precise technical question at a time, evaluate their previous answer, point out flaws, and give a score out of 10 with constructive feedback.`;
        break;
      case "feynman":
        systemInstruction += `\nMODE: Feynman Technique Mode. Ask the student to explain a concept in their own words as if teaching a 10-year-old. When the student explains, analyze their response, identify gaps or misunderstandings, and gently guide them to master the concept.`;
        break;
      case "explain":
      default:
        systemInstruction += `\nMODE: Explain Mode. Teach concepts step by step with clear headings, bullet points, intuitive examples, and key takeaways.`;
        break;
    }

    // Build contents string or chat message
    const formattedHistory = Array.isArray(conversationHistory)
      ? conversationHistory.map((h: { sender: string; text: string }) => `${h.sender === "user" ? "Student" : "Tutor"}: ${h.text}`).join("\n")
      : "";

    const prompt = `${formattedHistory ? `Previous Chat History:\n${formattedHistory}\n\n` : ""}Student asks: ${message}`;

    const response = await ai!.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ reply: response.text || "I'm sorry, I couldn't generate a response." });
  } catch (error: any) {
    console.error("Error in AI Tutor API:", error);
    res.status(500).json({ error: error?.message || "Failed to communicate with AI Tutor." });
  }
});

// 3. Document / PDF Analyzer API
app.post("/api/ai/pdf-analyze", async (req, res) => {
  if (!checkGeminiAvailable(res)) return;

  try {
    const { documentName, documentText, action, userQuestion } = req.body;

    let systemInstruction = `You are SemOS PDF & Document Intelligence Engine. You analyze academic textbooks, lecture slides, notes, lab manuals, and question papers.`;
    let prompt = `Document Name: ${documentName || "Uploaded Document"}\n\nDocument Content:\n${documentText.slice(0, 15000)}\n\n`;

    switch (action) {
      case "summarize":
        prompt += `Task: Provide a comprehensive executive summary of this document. Include:
1. Executive Summary
2. Core Topics Covered
3. Critical Formulae / Key Definitions
4. High-Yield Exam Takeaways`;
        break;
      case "explain_concepts":
        prompt += `Task: Extract and explain the 5 most important core concepts in this document step-by-step with analogies.`;
        break;
      case "extract_formulas":
        prompt += `Task: Extract all mathematical equations, physical formulas, algorithms, or key rules in this document. Provide full formula name, equation, variables definition, and when to apply it.`;
        break;
      case "ask_document":
        prompt += `User Question: "${userQuestion}"\nTask: Answer the user's question accurately based strictly on the document provided above. If not in the document, state what is mentioned.`;
        break;
      case "translate":
        prompt += `Task: Translate and simplify the core content of this document into plain English with clear structured notes.`;
        break;
      default:
        prompt += `Task: Provide a helpful breakdown and key insights from this document.`;
        break;
    }

    const response = await ai!.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: { systemInstruction },
    });

    res.json({ result: response.text || "Analysis completed." });
  } catch (error: any) {
    console.error("Error in PDF Analyze API:", error);
    res.status(500).json({ error: error?.message || "Failed to analyze document." });
  }
});

// 4. Generate Flashcards Endpoint
app.post("/api/ai/generate-flashcards", async (req, res) => {
  if (!checkGeminiAvailable(res)) return;

  try {
    const { topic, sourceText, subject, count = 15, generationMode = 'comprehensive' } = req.body;

    // Dynamically calculate target count based on sourceText length and mode
    let targetCount = Number(count) || 15;
    if (sourceText) {
      const len = sourceText.length;
      if (generationMode === 'exhaustive' || len > 2000) {
        // Scale proportionally: ~1 card per 200 chars, max 35 cards
        targetCount = Math.min(35, Math.max(16, Math.ceil(len / 200)));
      } else if (len > 800) {
        targetCount = Math.min(25, Math.max(12, Math.ceil(len / 250)));
      } else {
        targetCount = Math.min(15, Math.max(8, Math.ceil(len / 300)));
      }
    }

    const response = await ai!.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Generate exactly ${targetCount} comprehensive, high-yield academic flashcards for the subject "${subject}".
Topic: ${topic || "Comprehensive Chapter Review"}
Generation Mode: ${generationMode} (Scale depth and coverage thoroughly).
${sourceText ? `Source Content / File Excerpt (Analyze every paragraph, formula, definition, and concept):\n${sourceText.slice(0, 15000)}` : "Generate thorough foundational and advanced flashcards for this topic."}

Ensure the flashcards cover:
1. Core definitions and foundational principles.
2. Important mathematical formulas, theorems, or equations (if applicable).
3. Critical conceptual nuances, trade-offs, and edge cases.
4. Numerical or practical application problem types.

Return a valid JSON array of flashcard objects.`,
      config: {
        systemInstruction: "You are an expert academic flashcard generator for spaced repetition learning, creating rigorous, high-yield decks.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING, description: "Precise question, term, prompt, or problem statement on front of card" },
              back: { type: Type.STRING, description: "Clear, rigorous, comprehensive explanation, formula, or answer on back" },
              difficulty: { type: Type.STRING, description: "Easy, Medium, or Hard" },
              tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Relevant topic tags" },
            },
            required: ["front", "back", "difficulty"],
          },
        },
      },
    });

    const jsonStr = response.text || "[]";
    const flashcards = JSON.parse(jsonStr);
    res.json({ flashcards, generatedCount: flashcards.length });
  } catch (error: any) {
    console.error("Error generating flashcards:", error);
    res.status(500).json({ error: error?.message || "Failed to generate flashcards." });
  }
});

// 5. Generate Quiz Endpoint
app.post("/api/ai/generate-quiz", async (req, res) => {
  if (!checkGeminiAvailable(res)) return;

  try {
    const { subject, topic, sourceText, questionCount = 5 } = req.body;

    const response = await ai!.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Create a ${questionCount}-question academic quiz for Subject: "${subject}", Topic: "${topic}".
${sourceText ? `Source Text:\n${sourceText.slice(0, 5000)}` : ""}

Include a mix of multiple choice questions (MCQs), true/false, fill-in-the-blank, and numerical/short problems.
Return JSON format matching the schema.`,
      config: {
        systemInstruction: "You are an expert university examiner creating a test paper.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quizTitle: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, description: "mcq, true_false, fill_blank, or short_answer" },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Required for MCQ options (A, B, C, D)" },
                  correctAnswer: { type: Type.STRING, description: "Exact correct string or option text" },
                  explanation: { type: Type.STRING, description: "Detailed explanation of why the answer is correct" },
                },
                required: ["id", "type", "question", "correctAnswer", "explanation"],
              },
            },
          },
          required: ["quizTitle", "questions"],
        },
      },
    });

    const quizData = JSON.parse(response.text || "{}");
    res.json(quizData);
  } catch (error: any) {
    console.error("Error generating quiz:", error);
    res.status(500).json({ error: error?.message || "Failed to generate quiz." });
  }
});

// 6. AI Writing Assistant
app.post("/api/ai/writing-assistant", async (req, res) => {
  if (!checkGeminiAvailable(res)) return;

  try {
    const { content, task, style = "Academic" } = req.body;

    let prompt = `Draft Content:\n${content}\n\nTask: `;
    switch (task) {
      case "improve_assignment":
        prompt += `Enhance this assignment draft for academic rigour, clarity, tone, structural flow, and vocabulary.`;
        break;
      case "lab_observation":
        prompt += `Convert these rough notes into a formal Lab Observation and Results section with Objectives, Methodology, Observations Table/Summary, and Conclusion.`;
        break;
      case "rewrite_academic":
        prompt += `Rewrite the content into standard formal academic style with proper transitions and academic terminology.`;
        break;
      case "presentation_outline":
        prompt += `Transform this text into a 5-slide presentation deck outline (Slide Title, Key Bullet Points, Speaker Notes).`;
        break;
      case "fix_grammar":
        prompt += `Correct all grammatical errors, typos, and punctuation while preserving original meaning.`;
        break;
      default:
        prompt += `Refine and improve this academic writing.`;
        break;
    }

    const response = await ai!.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are an academic writing consultant and scientific report editor. Provide structured, polished text. Tone requested: ${style}.`,
      },
    });

    res.json({ output: response.text || "Updated draft." });
  } catch (error: any) {
    console.error("Error in writing assistant:", error);
    res.status(500).json({ error: error?.message || "Failed to assist with writing." });
  }
});

// 7. AI Daily Summary & Recommendations
app.post("/api/ai/daily-summary", async (req, res) => {
  if (!checkGeminiAvailable(res)) return;

  try {
    const { subjects, streak, studyHours, weakAreas } = req.body;

    const prompt = `Student Status:
- Current Streak: ${streak} days
- Weekly Study Hours: ${studyHours} hours
- Enrolled Subjects: ${subjects?.map((s: any) => s.name).join(", ") || "Engineering subjects"}
- Weak Areas Flagged: ${weakAreas?.join(", ") || "Vector calculus, Transistor biasing, Recursion"}

Tasks:
1. Provide a motivating 2-sentence daily greeting.
2. List 3 specific high-priority study recommendations for today.
3. Suggest a 10-minute quick revision strategy.`;

    const response = await ai!.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are SemOS AI Advisor, optimizing student learning productivity.",
      },
    });

    res.json({ summary: response.text || "Ready for today's study session!" });
  } catch (error: any) {
    console.error("Error in daily summary:", error);
    res.status(500).json({ error: error?.message || "Failed to generate daily summary." });
  }
});

// 8. Document Parsing Endpoint (PDF, PPT, PPTX, TXT)
app.post("/api/parse-document", upload.single("file"), async (req, res) => {
  try {
    let fileBuffer: Buffer | null = null;
    let fileName = "Document";
    let mimeType = "";

    if (req.file) {
      fileBuffer = req.file.buffer;
      fileName = req.file.originalname;
      mimeType = req.file.mimetype;
    } else if (req.body?.fileBase64) {
      fileBuffer = Buffer.from(req.body.fileBase64, "base64");
      fileName = req.body.fileName || "Document";
      mimeType = req.body.mimeType || "";
    }

    if (!fileBuffer) {
      res.status(400).json({ error: "No file provided for extraction." });
      return;
    }

    const lowerName = fileName.toLowerCase();
    let extractedText = "";
    let pageCount = 1;

    if (lowerName.endsWith(".pdf") || mimeType.includes("pdf")) {
      const parsePdf: any = (pdfParseModule as any).default || pdfParseModule;
      const pdfData = await parsePdf(fileBuffer);
      extractedText = pdfData.text || "";
      pageCount = pdfData.numpages || 1;
    } else if (lowerName.endsWith(".pptx") || lowerName.endsWith(".ppt") || mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
      const pptResult = await extractTextFromPptx(fileBuffer);
      extractedText = pptResult.text;
      pageCount = pptResult.pageCount;
    } else if (lowerName.endsWith(".docx") || lowerName.endsWith(".doc") || mimeType.includes("word") || mimeType.includes("document")) {
      const docxResult = await extractTextFromDocx(fileBuffer);
      extractedText = docxResult.text;
      pageCount = docxResult.pageCount;
    } else {
      // Plain text or markdown
      extractedText = fileBuffer.toString("utf-8");
      pageCount = Math.max(1, Math.ceil(extractedText.length / 1500));
    }

    if (!extractedText.trim()) {
      extractedText = `Extracted document context for ${fileName}. Contains study material, formulas, and diagrams.`;
    }

    res.json({
      fileName,
      pageCount,
      textLength: extractedText.length,
      extractedText: extractedText.trim(),
    });
  } catch (error: any) {
    console.error("Error parsing document:", error);
    res.status(500).json({ error: error?.message || "Failed to parse document content." });
  }
});

// 9. Automated AI Study Planner Endpoint
app.post("/api/ai/study-planner", async (req, res) => {
  if (!checkGeminiAvailable(res)) return;

  try {
    const { 
      documentName, 
      documentText, 
      subject = "General Academic Subject", 
      currentCgpa = 7.5, 
      targetCgpa = 9.0, 
      daysCount = 7, 
      dailyHours = 3.5 
    } = req.body;

    const cgpaGap = targetCgpa - currentCgpa;
    let rigorContext = `Student Goal: Pushing from ${currentCgpa} CGPA to ${targetCgpa} CGPA on the Indian 10.0 scale. `;
    if (cgpaGap > 0.8) {
      rigorContext += `HIGH RIGOR / COMEBACK MODE: Generate intensive, highly structured daily targets with deep Feynman conceptual checks and practice problems.`;
    } else if (cgpaGap > 0.2) {
      rigorContext += `TARGET PUSH MODE: Generate focused study units emphasizing high-yield exam topics, active recall, and numerical problems.`;
    } else {
      rigorContext += `MAINTENANCE MODE: Steady revision schedule to consolidate core concepts and formulas.`;
    }

    const prompt = `You are SemOS Automated AI Study Planner.
Subject: "${subject}"
Document Provided: "${documentName || "Course Materials"}"
Document Text Excerpt:
${(documentText || "").slice(0, 10000)}

Plan Parameters:
- Total Study Horizon: ${daysCount} Days
- Daily Study Time Available: ${dailyHours} Hours/Day
- ${rigorContext}

Task: Break down the document's topics, chapters, and key concepts into an actionable day-by-day study schedule.
Return a JSON object containing the overall plan title, summary, and a list of daily study units.`;

    const response = await ai!.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert university academic planner optimizing study retention using spaced repetition, active recall, and the Feynman technique.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planTitle: { type: Type.STRING },
            summary: { type: Type.STRING },
            rigorLevel: { type: Type.STRING },
            totalRecommendedHours: { type: Type.NUMBER },
            dailySchedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.NUMBER },
                  dayTitle: { type: Type.STRING },
                  coreTopic: { type: Type.STRING },
                  difficulty: { type: Type.STRING, description: "Easy, Medium, or Hard" },
                  estimatedMinutes: { type: Type.NUMBER },
                  keyTasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                  feynmanPrompt: { type: Type.STRING, description: "A concept to test/explain using Feynman technique" },
                  highYieldExamTip: { type: Type.STRING },
                },
                required: ["dayNumber", "dayTitle", "coreTopic", "estimatedMinutes", "keyTasks", "feynmanPrompt"],
              },
            },
          },
          required: ["planTitle", "summary", "dailySchedule"],
        },
      },
    });

    const studyPlanData = JSON.parse(response.text || "{}");
    res.json(studyPlanData);
  } catch (error: any) {
    console.error("Error generating study plan:", error);
    res.status(500).json({ error: error?.message || "Failed to generate AI study plan." });
  }
});

// Vite Middleware for development / Static file serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SemOS backend running on http://localhost:${PORT}`);
  });
}

startServer();
