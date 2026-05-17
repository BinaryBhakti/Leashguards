import { DocumentProcessorServiceClient } from "@google-cloud/documentai";

export function documentAiStatus() {
  return {
    configured: Boolean(
      process.env.GOOGLE_CLOUD_PROJECT_ID &&
        process.env.GOOGLE_CLOUD_LOCATION &&
        process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID
    ),
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || "",
    location: process.env.GOOGLE_CLOUD_LOCATION || "",
    processorId: process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID ? "configured" : ""
  };
}

export async function parseWithDocumentAi(buffer, mimeType = "application/pdf") {
  const status = documentAiStatus();
  if (!status.configured) {
    return {
      text: "",
      warnings: [
        "Scanned PDF OCR needs Google Document AI configuration: GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_LOCATION, GOOGLE_DOCUMENT_AI_PROCESSOR_ID, and Google credentials."
      ],
      metadata: {
        parser: "document-ai-not-configured"
      }
    };
  }

  const client = new DocumentProcessorServiceClient();
  const name = client.processorPath(
    process.env.GOOGLE_CLOUD_PROJECT_ID,
    process.env.GOOGLE_CLOUD_LOCATION,
    process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID
  );

  const [result] = await client.processDocument({
    name,
    rawDocument: {
      content: buffer.toString("base64"),
      mimeType
    }
  });

  return {
    text: result.document?.text || "",
    warnings: [],
    metadata: {
      parser: "google-document-ai",
      pages: result.document?.pages?.length || 0
    }
  };
}

