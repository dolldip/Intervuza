
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
  roundType: z.enum(['technical', 'hr', 'both']).default('technical'),
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
1. Generate a warm, professional, and slightly challenging opening statement.
2. Generate ONLY the FIRST question.
3. The question must be specific to the role and the requested round ({{roundType}}).
4. If technical, ask about a core skill or architectural challenge. If HR, ask about a behavioral situation.
5. Do NOT ask multiple questions.
6. Do NOT behave like a chatbot. Use natural professional language.

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
