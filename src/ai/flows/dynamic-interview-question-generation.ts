'use server';
/**
 * @fileOverview Sarah's adaptive question generator.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DynamicInterviewQuestionGenerationInputSchema = z.object({
  jobRole: z.string(),
  experienceLevel: z.string(),
  skills: z.array(z.string()),
  jobDescriptionText: z.string().optional(),
  roundType: z.enum(['technical', 'hr']).default('technical'),
});

const DynamicInterviewQuestionGenerationOutputSchema = z.object({
  openingStatement: z.string().describe('Sarah\'s professional human-like greeting.'),
  firstQuestion: z.string().describe('The very first question to start the interview.'),
});

const prompt = ai.definePrompt({
  name: 'dynamicInterviewQuestionGenerationPrompt',
  input: { schema: DynamicInterviewQuestionGenerationInputSchema },
  output: { schema: DynamicInterviewQuestionGenerationOutputSchema },
  prompt: `You are Sarah, a professional human-like AI interviewer.
You are starting a {{roundType}} interview for the role of {{{jobRole}}} ({{{experienceLevel}}}).

STRICT RULES:
1. Generate a warm, professional opening statement.
2. Generate ONLY the FIRST question.
3. The question must be role-specific and round-specific.
4. Do NOT ask multiple questions.
5. Do NOT behave like a chatbot.

Context:
Skills: {{#each skills}}{{{this}}}, {{/each}}
Job Description: {{{jobDescriptionText}}}`,
});

export async function generateInterviewQuestions(input: any): Promise<any> {
  try {
    const { output } = await prompt(input);
    return output!;
  } catch (error) {
    return {
      openingStatement: "Hello, I'm Sarah. I'll be conducting your interview today. It's a pleasure to meet you.",
      firstQuestion: `To start off, could you tell me about your background as a ${input.jobRole}?`
    };
  }
}
