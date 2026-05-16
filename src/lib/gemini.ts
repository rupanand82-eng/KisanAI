import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const MODEL_NAME = "gemini-3-flash-preview";

export async function analyzeCropImage(base64Image: string, mimeType: string, language: string = "English") {
  const prompt = `
    You are an expert Agricultural Scientist and Crop Doctor. 
    Analyze the provided image of a plant/crop.
    
    Provide your response in ${language}.
    
    Structure your response as follows:
    1. **Diagnosis**: What is the crop and what is the issue (disease, pest, nutrient deficiency, or healthy)?
    2. **Reasoning**: Why do you think so? Mention visual signs.
    3. **Confidence Level**: High/Medium/Low.
    4. **Recommendation**: Step-by-step actions the farmer should take.
    5. **Organic/Low-cost Solutions**: Specifically mention traditional or organic methods.
    6. **Warning**: Remind the user to consult a local agricultural officer for critical decisions.
    
    Keep the language simple and easy to understand for a rural farmer.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Image, mimeType } }
          ]
        }
      ]
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}

export async function getGeneralAdvisory(query: string, weatherData: any, language: string = "English") {
  const context = weatherData ? `Current weather: ${weatherData.temp}°C, ${weatherData.condition}.` : "";
  const prompt = `
    You are a helpful Agricultural Advisor for farmers.
    ${context}
    
    User Query: "${query}"
    
    Provide practical, weather-aware farming advice in ${language}.
    Be concise and use simple language.
    If you don't know something, suggest contacting the local Krishi Vigyan Kendra (Agricultural Science Center).
  `;

  try {
    const chat = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: "You are " + (language === "Telugu" ? "ఒక వ్యవసాయ సలహాదారు" : language === "Hindi" ? "एक कृषि सलाहकार" : "an agricultural advisor") + " helping farmers with practical solutions."
      }
    });

    const response = await chat.sendMessage({ message: prompt });
    return response.text;
  } catch (error) {
    console.error("Gemini Advisory Error:", error);
    throw error;
  }
}
