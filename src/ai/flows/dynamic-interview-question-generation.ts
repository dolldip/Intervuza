'use server';
/**
 * @fileOverview This file implements a Genkit flow for dynamically generating interview questions.
 *
 * - generateInterviewQuestions - A function that orchestrates the generation of interview questions.
 * - DynamicInterviewQuestionGenerationInput - The input type for the generateInterviewQuestions function.
 * - DynamicInterviewQuestionGenerationOutput - The return type for the generateInterviewQuestions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DynamicInterviewQuestionGenerationInputSchema = z.object({
  jobRole: z.string().describe('The job role the user is preparing for (e.g., "Software Engineer", "HR Manager").'),
  experienceLevel: z.string().describe('The user\'s experience level (e.g., "Junior", "Mid-level", "Senior").'),
  skills: z.array(z.string()).describe('A list of skills the user possesses relevant to the job role.'),
  resumeText: z.string().describe('The full text content of the user\'s resume.').optional(),
  jobDescriptionText: z.string().describe('The full text content of the job description for the target role.').optional(),
});
export type DynamicInterviewQuestionGenerationInput = z.infer<typeof DynamicInterviewQuestionGenerationInputSchema>;

const DynamicInterviewQuestionGenerationOutputSchema = z.object({
  questions: z.array(z.string()).describe('A list of dynamically generated interview questions.'),
});
export type DynamicInterviewQuestionGenerationOutput = z.infer<typeof DynamicInterviewQuestionGenerationOutputSchema>;

export async function generateInterviewQuestions(input: DynamicInterviewQuestionGenerationInput): Promise<DynamicInterviewQuestionGenerationOutput> {
  return dynamicInterviewQuestionGenerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dynamicInterviewQuestionGenerationPrompt',
  input: { schema: DynamicInterviewQuestionGenerationInputSchema },
  output: { schema: DynamicInterviewQuestionGenerationOutputSchema },
  prompt: `You are an expert interviewer for the {{jobRole}} role. Your task is to generate relevant and dynamic interview questions.

Consider the following information about the candidate and the target job:

Candidate's Job Role: {{{jobRole}}}
Candidate's Experience Level: {{{experienceLevel}}}
Candidate's Skills: {{#each skills}}- {{{this}}}\n{{/each}}

{{#if resumeText}}
Candidate's Resume:
"""
{{{resumeText}}}
"""
{{/if}}

{{#if jobDescriptionText}}
Target Job Description:
"""
{{{jobDescriptionText}}}
"""
{{/if}}

Generate a list of 5-7 interview questions covering technical, behavioral, and situational aspects based on the provided context. The questions should be tailored to the candidate's experience level and the specifics of the job role and description. Focus on questions that would help assess their fit for this specific role.

Return the questions in a JSON array format as specified by the output schema.`,
});

const dynamicInterviewQuestionGenerationFlow = ai.defineFlow(
  {
    name: 'dynamicInterviewQuestionGenerationFlow',
    inputSchema: DynamicInterviewQuestionGenerationInputSchema,
    outputSchema: DynamicInterviewQuestionGenerationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
