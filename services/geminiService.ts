import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiClient) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("API_KEY is missing. AI features will not work.");
      // We don't throw here to allow app to render, but requests will fail.
      throw new Error("API_KEY is missing in environment variables.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

export const generateSignConcept = async (prompt: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a creative and catchy slogan or short description for a shop sign based on this request: "${prompt}". Keep it short (under 10 words) and suitable for signage.`,
    });
    return response.text || "Sign Concept";
  } catch (error) {
    console.error("Error generating concept:", error);
    return "Custom Signage";
  }
};

export const generateSignImage = async (prompt: string): Promise<string | null> => {
  try {
    // Using gemini-2.5-flash-image for generation as per guidelines
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `A professional 2D vector graphic logo or sign design for: ${prompt}. White background, high contrast, flat design, suitable for a shop front.` }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    return null;

  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};