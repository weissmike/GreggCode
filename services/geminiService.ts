
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { RecognitionResult } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

export const recognizeShorthand = async (base64Image: string, context?: string): Promise<RecognitionResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const systemInstruction = `
    You are a 1940s intelligence officer and an expert in Gregg Shorthand. 
    Your mission is to decode handwritten shorthand marks obtained from field reports.
    
    Gregg shorthand rules (Simplified/Anniversary):
    - T (short down), D (long down)
    - N (short horiz), M (long horiz)
    - P (short left curve), B (long left curve)
    - F (short right curve), V (long right curve)
    - E (small circle), A (large circle)
    - S (tiny comma)
    - R (short forward curve), L (long forward curve)
    
    The Brief Forms provided by the user are highly specific contractions.
    If context is provided, you are checking if the user's stroke matches the standard shorthand for that word.
    Respond in the style of a concise, professional intelligence report. 
    Always return JSON: { "prediction": "word", "confidence": 0-1, "explanation": "Brief tactical feedback about stroke length, curve, or loop size." }
  `;

  const prompt = context 
    ? `ANALYZE STROKE: Does this drawing accurately represent the shorthand for "${context}"? 
       Check against the Brief Form standard. 
       If it is correct, return confidence 0.85+. If incorrect, note the flaw (e.g. "Stroke too long, resembles 'D' rather than 'T'").`
    : `DECODE INTERCEPT: Translate this shorthand mark. 
       Look for common Brief Forms or phonetic combinations.`;

  const imagePart = {
    inlineData: {
      mimeType: 'image/png',
      data: base64Image.split(',')[1],
    },
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      prediction: result.prediction || "UNREADABLE",
      confidence: result.confidence || 0,
      explanation: result.explanation || "Transmission noisy. No secondary intel available."
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("COMMUNICATION ENCRYPTION ERROR. RESTART TERMINAL.");
  }
};
