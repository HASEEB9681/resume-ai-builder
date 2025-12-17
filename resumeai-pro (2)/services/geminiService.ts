import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, GeneratedResume, MatchResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const RESUME_MODEL = "gemini-2.5-flash";

// --- Granular AI Helpers for Form Wizard ---

export const generateSingleSummary = async (jobTitle: string, experience: string): Promise<string> => {
  const prompt = `Write a professional, 2-3 sentence resume summary for a ${jobTitle}. 
  Key experience/traits: ${experience}. 
  Keep it punchy and energetic. Do not include a header.`;
  
  const response = await ai.models.generateContent({
    model: RESUME_MODEL,
    contents: prompt,
  });
  return response.text || "";
}

export const generateJobDescription = async (role: string, company: string): Promise<string[]> => {
  const prompt = `Generate 4 impactful, metric-driven resume bullet points for a ${role} position at ${company}. 
  Focus on achievements. Return strictly a JSON array of strings.`;
  
  const response = await ai.models.generateContent({
    model: RESUME_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  
  return JSON.parse(response.text || "[]");
}

export const suggestSkills = async (role: string): Promise<string[]> => {
  const prompt = `List 10 relevant technical and soft skills for a ${role}. Return strictly a JSON array of strings.`;
   const response = await ai.models.generateContent({
    model: RESUME_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}


// --- Full Resume Optimization (Existing) ---

export const generateOptimizedResume = async (profile: UserProfile): Promise<GeneratedResume> => {
  const prompt = `
    You are an expert Resume Writer and ATS specialist. 
    Analyze the provided user profile and generate professional, action-oriented content.
    
    1. Rewrite the summary to be punchy and professional.
    2. For each experience entry, convert the description into 3-4 strong, quantifiable bullet points using action verbs.
    3. For each project entry, convert the description into 2-3 impactful bullet points highlighting tech stack and outcome.
    4. Extract and categorize key hard and soft skills into a clean list.

    Input Data:
    ${JSON.stringify(profile)}
  `;

  const response = await ai.models.generateContent({
    model: RESUME_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          professionalSummary: { type: Type.STRING },
          enhancedExperience: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "The same ID as the input experience" },
                bullets: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING } 
                }
              }
            }
          },
          enhancedProjects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "The same ID as the input project" },
                bullets: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING } 
                }
              }
            }
          },
          skillsList: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as GeneratedResume;
  }
  throw new Error("Failed to generate resume content");
};

// 2. Analyze Job Match
export const analyzeJobMatch = async (resumeText: string, jobDescription: string): Promise<MatchResult> => {
  const prompt = `
    You are an ATS (Applicant Tracking System) Simulator.
    Compare the following Resume text against the Job Description.
    
    Resume:
    ${resumeText.substring(0, 5000)}

    Job Description:
    ${jobDescription.substring(0, 5000)}

    Return a match score (0-100), a list of important missing keywords from the JD that are not in the resume, and 3 specific suggestions to improve the resume for this role.
  `;

  const response = await ai.models.generateContent({
    model: RESUME_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          missingKeywords: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING } 
          }
        }
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as MatchResult;
  }
  throw new Error("Failed to analyze job match");
};

// 3. Generate Cover Letter
export const generateCoverLetter = async (profile: UserProfile, jobDescription: string): Promise<string> => {
  const prompt = `
    Write a professional, engaging cover letter for this candidate applying to the job described below.
    
    Structure the cover letter as follows:
    1. Header: Include the Candidate's Full Name, Email, Phone Number, LinkedIn (if available), Website (if available) and Location at the very top.
    2. Date: Include today's date.
    3. Salutation: Professional greeting.
    4. Body: Write a confident but polite letter explaining why the candidate's specific experience and skills make them a good fit.
    
    Candidate Profile:
    ${JSON.stringify(profile)}

    Job Description:
    ${jobDescription}

    Format the output as plain text with line breaks.
  `;

  const response = await ai.models.generateContent({
    model: RESUME_MODEL,
    contents: prompt,
  });

  return response.text || "Could not generate cover letter.";
};