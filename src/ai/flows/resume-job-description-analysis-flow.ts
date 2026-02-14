'use server';
/**
 * @fileOverview This file implements a Genkit flow for analyzing a user's resume and a job description.
 * It extracts key skills, experience, projects, and keywords from both.
 *
 * - resumeJobDescriptionAnalysis - The main function to trigger the analysis.
 * - ResumeJobDescriptionAnalysisInput - The input type for the analysis.
 * - ResumeJobDescriptionAnalysisOutput - The output type of the analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ResumeJobDescriptionAnalysisInputSchema = z.object({
  resumeText: z
    .string()
    .min(1)
    .describe('The full text content of the user\'s resume.'),
  jobDescriptionText: z
    .string()
    .min(1)
    .describe('The full text content of the job description.'),
});
export type ResumeJobDescriptionAnalysisInput = z.infer<
  typeof ResumeJobDescriptionAnalysisInputSchema
>;

const ResumeJobDescriptionAnalysisOutputSchema = z.object({
  resume: z.object({
    extractedSkills: z.array(z.string()).describe('List of key skills extracted from the resume.'),
    extractedExperience: z.array(z.string()).describe('List of key experiences/responsibilities extracted from the resume.'),
    extractedProjects: z.array(z.object({
      title: z.string(),
      description: z.string()
    })).describe('List of projects mentioned in the resume.'),
    extractedKeywords: z.array(z.string()).describe('List of relevant keywords extracted from the resume.'),
  }),
  jobDescription: z.object({
    requiredSkills: z.array(z.string()).describe('List of required skills mentioned in the job description.'),
    requiredExperience: z.array(z.string()).describe('List of required experiences/qualifications from the job description.'),
    jobKeywords: z.array(z.string()).describe('List of important keywords and terms from the job description.'),
  }),
  matchingSkills: z.array(z.string()).describe('List of skills that appear in both the resume and the job description.'),
  missingSkills: z.array(z.string()).describe('List of skills required by the job description but not found in the resume.'),
});
export type ResumeJobDescriptionAnalysisOutput = z.infer<
  typeof ResumeJobDescriptionAnalysisOutputSchema
>;

export async function resumeJobDescriptionAnalysis(
  input: ResumeJobDescriptionAnalysisInput
): Promise<ResumeJobDescriptionAnalysisOutput> {
  return resumeJobDescriptionAnalysisFlow(input);
}

const resumeJobDescriptionAnalysisPrompt = ai.definePrompt({
  name: 'resumeJobDescriptionAnalysisPrompt',
  input: { schema: ResumeJobDescriptionAnalysisInputSchema },
  output: { schema: ResumeJobDescriptionAnalysisOutputSchema },
  prompt: `You are an expert HR analyst and Technical Recruiter. Your task is to carefully analyze a job seeker's resume and a specific job description.

Extract the following:
1. Core skills.
2. Experience history.
3. SPECIFIC PROJECTS: Look for any mentioned projects, apps, or initiatives.
4. Required skills from the JD.

Compare them to find gaps. Ensure the output is strictly in JSON format.

--- Resume Text ---
{{{resumeText}}}

--- Job Description Text ---
{{{jobDescriptionText}}}
`,
});

const resumeJobDescriptionAnalysisFlow = ai.defineFlow(
  {
    name: 'resumeJobDescriptionAnalysisFlow',
    inputSchema: ResumeJobDescriptionAnalysisInputSchema,
    outputSchema: ResumeJobDescriptionAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await resumeJobDescriptionAnalysisPrompt(input);
    if (!output) {
      throw new Error('Failed to generate analysis output.');
    }
    return output;
  }
);
