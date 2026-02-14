'use server';
/**
 * @fileOverview Dynamically generates interview questions with quota fallbacks.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DynamicInterviewQuestionGenerationInputSchema = z.object({
  jobRole: z.string(),
  experienceLevel: z.string(),
  skills: z.array(z.string()),
  resumeText: z.string().optional(),
  jobDescriptionText: z.string().optional(),
});

const DynamicInterviewQuestionGenerationOutputSchema = z.object({
  questions: z.array(z.string()),
});

const prompt = ai.definePrompt({
  name: 'dynamicInterviewQuestionGenerationPrompt',
  input: { schema: DynamicInterviewQuestionGenerationInputSchema },
  output: { schema: DynamicInterviewQuestionGenerationOutputSchema },
  prompt: `Generate 5 interview questions for a {{jobRole}} ({{experienceLevel}} level). Skills: {{#each skills}}{{{this}}}, {{/each}}`,
});

export async function generateInterviewQuestions(input: any): Promise<any> {
  try {
    const { output } = await prompt(input);
    return output!;
  } catch (error) {
    console.warn("Quota exceeded. Using standard questions.");
    return {
      questions: [
        "Tell me about a difficult technical challenge you've faced.",
        "How do you stay up-to-date with industry trends?",
        "Describe a time you had a conflict with a teammate.",
        "What is your approach to learning a new technology?",
        "Where do you see yourself in five years?"
      ]
    };
  }
}
