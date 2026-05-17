import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import Tesseract from "tesseract.js";
import { parseWithDocumentAi } from "./documentAiParser.js";

const textExtensions = new Set([".txt", ".md", ".csv", ".text"]);
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"]);
const maxUploadBytes = 25 * 1024 * 1024;
const maxExtractedCharacters = 350000;

export async function parseDocument(file, options = {}) {
  const extension = extname(file.originalFilename || file.newFilename || "").toLowerCase();
  const mimeType = file.mimetype || "";

  validateFile(file, extension, mimeType);

  const buffer = await readFile(file.filepath);
  validateMagicBytes(buffer, extension);

  if (extension === ".pdf" || mimeType === "application/pdf") {
    return parsePdf(buffer, file);
  }

  if (extension === ".docx" || mimeType.includes("wordprocessingml")) {
    return parseDocx(buffer, file);
  }

  if (extension === ".rtf" || mimeType === "application/rtf") {
    return parseRtf(buffer, file);
  }

  if (imageExtensions.has(extension) || mimeType.startsWith("image/")) {
    return parseImage(file.filepath, file, options.ocrLanguage);
  }

  if (textExtensions.has(extension) || mimeType.startsWith("text/")) {
    return {
      text: clampExtractedText(buffer.toString("utf8")),
      metadata: baseMetadata(file, "text"),
      warnings: []
    };
  }

  return {
    text: clampExtractedText(buffer.toString("utf8")),
    metadata: baseMetadata(file, "unknown-text-fallback"),
    warnings: ["Unknown file type. Leashguards attempted to read it as UTF-8 text."]
  };
}

async function parsePdf(buffer, file) {
  let result;
  try {
    result = await pdfParse(buffer);
  } catch (error) {
    const message = String(error.message || "");
    if (/password|encrypted/i.test(message)) {
      throw new Error("This PDF appears to be password-protected or encrypted. Remove protection or export an unlocked copy before upload.");
    }
    throw new Error("This PDF could not be parsed. It may be corrupt, malformed, or use an unsupported structure.");
  }

  const text = (result.text || "").trim();
  const warnings = [];

  if (text.length < 80) {
    const documentAiResult = await parseWithDocumentAi(buffer, file.mimetype || "application/pdf");
    const documentAiText = (documentAiResult.text || "").trim();

    if (documentAiText) {
      return {
        text: clampExtractedText(documentAiText),
        metadata: {
          ...baseMetadata(file, documentAiResult.metadata.parser),
          pages: documentAiResult.metadata.pages || result.numpages || 0,
          embeddedTextCharacters: text.length
        },
        warnings: documentAiResult.warnings
      };
    }

    warnings.push(...documentAiResult.warnings);
    warnings.push("No reliable embedded PDF text was detected. This is likely a scanned or image-only PDF.");
  }

  if (result.numpages > 50) {
    warnings.push("Large PDF detected. Review may take longer and extracted layout can be less precise.");
  }

  if (looksLikeTableHeavyText(text)) {
    warnings.push("Table-heavy or column-like PDF text detected. Use Google Document AI for layout-aware extraction when precision matters.");
  }

  return {
    text: clampExtractedText(text),
    metadata: {
      ...baseMetadata(file, "pdf"),
      pages: result.numpages || 0,
      info: result.info || {}
    },
    warnings
  };
}

async function parseDocx(buffer, file) {
  let result;
  try {
    result = await mammoth.extractRawText({ buffer });
  } catch (error) {
    throw new Error("This DOCX could not be parsed. It may be corrupt, password-protected, or not a valid DOCX file.");
  }
  const text = result.value || "";

  return {
    text: clampExtractedText(text),
    metadata: baseMetadata(file, "docx"),
    warnings: [
      ...(result.messages?.map((message) => message.message) || []),
      ...(text.trim() ? [] : ["DOCX parser produced no text. The document may be image-based, protected, or malformed."])
    ]
  };
}

async function parseRtf(buffer, file) {
  const text = buffer
    .toString("utf8")
    .replace(/\\'[0-9a-f]{2}/gi, " ")
    .replace(/\\[a-z]+\d* ?/gi, " ")
    .replace(/[{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    text: clampExtractedText(text),
    metadata: baseMetadata(file, "rtf"),
    warnings: ["RTF parsing uses lightweight text cleanup; verify formatting-sensitive clauses manually."]
  };
}

async function parseImage(filepath, file, language = process.env.LEASHGUARDS_OCR_LANG || process.env.LEXGUARD_OCR_LANG || "eng") {
  const result = await Tesseract.recognize(filepath, language);
  const confidence = Math.round(result.data.confidence || 0);
  return {
    text: clampExtractedText(result.data.text || ""),
    metadata: {
      ...baseMetadata(file, "ocr-image"),
      confidence,
      language
    },
    warnings: [
      ...(confidence < 70 ? ["OCR confidence is low. Review extracted text against the original scan."] : []),
      ...(language === "eng" ? [] : [`OCR language set to ${language}. Verify multilingual extraction manually.`])
    ]
  };
}

function validateFile(file, extension, mimeType) {
  if (!file.size) {
    throw new Error("Uploaded file is empty.");
  }

  if (file.size > maxUploadBytes) {
    throw new Error("Uploaded file is too large. Maximum supported size is 25 MB.");
  }

  const allowedExtensions = new Set([
    ".pdf",
    ".docx",
    ".rtf",
    ".txt",
    ".md",
    ".csv",
    ".text",
    ...imageExtensions
  ]);

  const allowedMime =
    mimeType.startsWith("text/") ||
    mimeType.startsWith("image/") ||
    mimeType === "application/pdf" ||
    mimeType === "application/rtf" ||
    mimeType.includes("wordprocessingml") ||
    mimeType === "application/octet-stream";

  if (!allowedExtensions.has(extension) && !allowedMime) {
    throw new Error("Unsupported file type. Upload PDF, DOCX, RTF, text, markdown, CSV, or image files.");
  }
}

function validateMagicBytes(buffer, extension) {
  if (extension === ".pdf" && !buffer.subarray(0, 5).toString("utf8").startsWith("%PDF")) {
    throw new Error("The uploaded file has a .pdf extension but is not a valid PDF.");
  }

  if (extension === ".docx") {
    const signature = buffer.subarray(0, 2).toString("hex");
    if (signature !== "504b") {
      throw new Error("The uploaded file has a .docx extension but is not a valid DOCX archive.");
    }
  }
}

function clampExtractedText(text) {
  if (text.length <= maxExtractedCharacters) return text;
  return `${text.slice(0, maxExtractedCharacters)}\n\n[Leashguards truncated extracted text after ${maxExtractedCharacters} characters for safe local processing.]`;
}

function looksLikeTableHeavyText(text) {
  const lines = text.split("\n").filter(Boolean);
  if (lines.length < 8) return false;
  const tabular = lines.filter((line) => /\s{3,}|\t|\|/.test(line)).length;
  return tabular / lines.length > 0.35;
}

function baseMetadata(file, parser) {
  return {
    parser,
    filename: file.originalFilename || file.newFilename || "uploaded-document",
    mimetype: file.mimetype || "unknown",
    size: file.size || 0
  };
}
