/**
 * PDF Content Analysis Utility
 * Detects if a PDF contains only text (no medical images)
 * Used to classify text-only PDFs as NON_XRAY validation-only results
 * 
 * Uses heuristic analysis since we don't have pdf-parse dependency:
 * 1. PDF file size analysis
 * 2. Magic bytes detection for embedded images
 * 3. Text content pattern analysis
 */

export interface PDFContentAnalysis {
  isTextOnly: boolean;
  hasImages: boolean;
  hasText: boolean;
  bufferAnalysis: string;
  estimatedConfidence: number;
  reason: string;
}

/**
 * Analyzes PDF buffer to detect if it's text-only (no medical images)
 * Uses heuristics without requiring external PDF parsing libraries
 * @param buffer - PDF file buffer
 * @returns Analysis result with detection status
 */
export async function analyzePDFContent(buffer: Buffer): Promise<PDFContentAnalysis> {
  try {
    console.log("[PDF_ANALYSIS] Starting PDF content analysis");
    console.log("[PDF_ANALYSIS] Buffer size:", buffer.length, "bytes");
    
    let isTextOnly = false;
    let hasImages = false;
    let reason = "";
    let confidence = 0.5;

    // Heuristic 1: Check file size
    // Medical X-ray PDFs are typically 1MB+ due to embedded images
    // Text-only PDFs are usually < 500KB
    const fileSizeKB = buffer.length / 1024;
    console.log("[PDF_ANALYSIS] File size:", fileSizeKB.toFixed(2), "KB");

    // Heuristic 2: Look for image stream markers in PDF
    // PDFs with embedded images contain specific binary markers
    const bufferString = buffer.toString('binary').substring(0, 100000); // Check first 100KB
    
    // PDF image stream markers - more comprehensive check
    const hasImageStream = /\/XObject|\/Image|\/EmbeddedFile|\/JPEG|\/FlateDecode|stream[\s\S]{1,10}[\x00-\x08\x0B-\x0C\x0E-\x1F]/.test(bufferString);
    const hasHighBinaryContent = /[\x00-\x08\x0B-\x0C\x0E-\x1F]/.test(bufferString.substring(0, 500));
    
    // Additional check: Look for Image XObjects (more reliable indicator)
    const hasImageXObject = /\/XObject.*?\/Im/.test(bufferString);
    
    console.log("[PDF_ANALYSIS] Image stream detected:", hasImageStream);
    console.log("[PDF_ANALYSIS] High binary content:", hasHighBinaryContent);
    console.log("[PDF_ANALYSIS] Image XObject detected:", hasImageXObject);

    // Heuristic 3: Analyze text extraction patterns
    // Try to extract text from PDF (basic approach)
    const textContent = extractTextFromPDFBuffer(buffer);
    const textLength = textContent.length;
    const wordCount = textContent.trim().split(/\s+/).length;
    
    console.log("[PDF_ANALYSIS] Extracted text length:", textLength, "bytes");
    console.log("[PDF_ANALYSIS] Estimated word count:", wordCount);

    // Decision logic - MORE AGGRESSIVE TEXT DETECTION
    // Priority: Detect text-only PDFs with high confidence
    
    // STRONG TEXT-ONLY INDICATORS
    if (textLength > 1000 && !hasImageStream && !hasImageXObject && fileSizeKB < 500) {
      // Lots of text, no image markers, reasonable file size = definitely text-only
      isTextOnly = true;
      hasImages = false;
      confidence = 0.98;
      reason = `Text-only PDF detected (${fileSizeKB.toFixed(0)}KB, ${wordCount} words, no image markers). This is a text document, not a medical X-ray.`;
      console.log("[PDF_ANALYSIS] Detected as text-only (Strong indicators: lots of text + no images)");
      
    } else if (fileSizeKB > 1000 && (hasImageStream || hasImageXObject || hasHighBinaryContent)) {
      // STRONG IMAGE INDICATORS
      isTextOnly = false;
      hasImages = true;
      confidence = 0.95;
      reason = "PDF contains embedded images or binary content (likely medical X-ray).";
      console.log("[PDF_ANALYSIS] Detected as image-based (Strong indicators: large file + image streams)");
      
    } else if (textLength > 2000 && wordCount > 100) {
      // MODERATE TEXT INDICATORS
      isTextOnly = true;
      hasImages = false;
      confidence = 0.85;
      reason = "PDF contains primarily text content (over 2000 bytes) without obvious medical imaging.";
      console.log("[PDF_ANALYSIS] Detected as text-only (Moderate: significant text volume)");
      
    } else if (fileSizeKB < 300 && textLength > 500 && !hasImageStream) {
      // MILD TEXT INDICATORS
      isTextOnly = true;
      hasImages = false;
      confidence = 0.75;
      reason = `Text-only PDF detected (${fileSizeKB.toFixed(0)}KB, moderate text). Likely a text document.`;
      console.log("[PDF_ANALYSIS] Detected as text-only (Mild: small file + some text)");
      
    } else if (textLength < 200 && fileSizeKB > 300) {
      // Large file with very little extractable text = image-based
      isTextOnly = false;
      hasImages = true;
      confidence = 0.85;
      reason = "PDF appears to be image-based (large file size, minimal extractable text).";
      console.log("[PDF_ANALYSIS] Detected as image-based (Large file + minimal text)");
      
    } else if (hasImageXObject || (hasImageStream && fileSizeKB > 300)) {
      // Has image markers and reasonable size = image-based
      isTextOnly = false;
      hasImages = true;
      confidence = 0.80;
      reason = "PDF appears to contain images (image markers detected).";
      console.log("[PDF_ANALYSIS] Detected as image-based (Image markers found)");
      
    } else if (fileSizeKB < 150) {
      // Very small file default to text-only (safer assumption for edge cases)
      isTextOnly = true;
      hasImages = false;
      confidence = 0.70;
      reason = `Small PDF file (${fileSizeKB.toFixed(0)}KB) likely contains text, not medical images.`;
      console.log("[PDF_ANALYSIS] Defaulting to text-only (Very small file size)");
      
    } else {
      // Uncertain - now default to REJECT for safety (stricter approach)
      // This prevents misleading medical results
      isTextOnly = true;
      hasImages = false;
      confidence = 0.65;
      reason = "PDF content uncertain. As a safety measure, treating as non-medical document.";
      console.log("[PDF_ANALYSIS] Uncertain classification, defaulting to REJECT for safety");
    }

    const result: PDFContentAnalysis = {
      isTextOnly,
      hasImages,
      hasText: textLength > 0,
      bufferAnalysis: `Size: ${fileSizeKB.toFixed(0)}KB, Text: ${textLength}B, Words: ${wordCount}, ImageStreams: ${hasImageStream}, ImageXObject: ${hasImageXObject}`,
      estimatedConfidence: confidence,
      reason
    };

    console.log("[PDF_ANALYSIS] Final Result:", {
      isTextOnly: result.isTextOnly,
      hasImages: result.hasImages,
      confidence: result.estimatedConfidence,
      reason: result.reason
    });

    return result;
  } catch (error) {
    console.error("[PDF_ANALYSIS] Error analyzing PDF:", error);
    // If we can't parse it, assume it might contain images (safe default)
    return {
      isTextOnly: false,
      hasImages: true,
      hasText: false,
      bufferAnalysis: "Analysis failed",
      estimatedConfidence: 0.5,
      reason: "Could not analyze PDF content. Proceeding with analysis for safety."
    };
  }
}

/**
 * Basic text extraction from PDF buffer
 * Looks for readable ASCII text between PDF stream markers
 * More comprehensive than before to catch tables and text content
 * @param buffer - PDF file buffer
 * @returns Extracted text content
 */
function extractTextFromPDFBuffer(buffer: Buffer): string {
  try {
    // Strategy 1: Extract ASCII text from entire buffer
    // PDFs contain text in readable form mixed with binary
    let text = "";
    const maxScan = Math.min(buffer.length, 500000); // Scan up to 500KB
    
    for (let i = 0; i < maxScan; i++) {
      const byte = buffer[i];
      // Keep printable ASCII characters (32-126) and newlines (10, 13)
      if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13) {
        text += String.fromCharCode(byte);
      }
    }
    
    // Strategy 2: Extract text between BT (Begin Text) and ET (End Text) markers
    const btMatch = text.match(/BT[\s\S]*?ET/g);
    if (btMatch && btMatch.length > 0) {
      const streamText = btMatch.join("\n");
      text = streamText + "\n" + text; // Combine for comprehensive analysis
    }
    
    // Strategy 3: Look for common table patterns and data
    // Tables in PDFs often contain significant readable text
    const tablePatterns = text.match(/\|[\s\S]*?\|/g); // Table borders
    const tabDelimited = text.match(/\t[\s\S]*?\t/g); // Tab-delimited data
    
    if (tablePatterns || tabDelimited) {
      console.log("[PDF_ANALYSIS] Table/structured data detected in PDF");
    }
    
    // Clean up: Remove excessive whitespace but preserve structure
    const cleanedText = text
      .replace(/\x00+/g, '') // Remove null bytes
      .replace(/\n\n\n+/g, '\n\n') // Reduce multiple newlines
      .trim();
    
    console.log("[PDF_ANALYSIS] Text extraction: Found", cleanedText.length, "characters");
    if (cleanedText.length > 0) {
      console.log("[PDF_ANALYSIS] Sample text:", cleanedText.substring(0, 200));
    }
    
    return cleanedText;
  } catch (error) {
    console.error("[PDF_ANALYSIS] Error extracting text:", error);
    return "";
  }
}

/**
 * Quick check if file appears to be text-only PDF
 * Used before full analysis to avoid unnecessary model processing
 * @param buffer - File buffer
 * @param mimeType - File MIME type
 * @returns True if file is definitely text-only
 */
export async function isTextOnlyPDF(buffer: Buffer, mimeType: string): Promise<boolean> {
  if (mimeType !== 'application/pdf') {
    return false; // Not a PDF
  }

  const analysis = await analyzePDFContent(buffer);
  return analysis.isTextOnly;
}
