'use server';
/**
 * @fileOverview Aria's adaptive question generator.
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
  openingStatement: z.string().describe('Aria\'s professional human-like greeting.'),
  firstQuestion: z.string().describe('The very first question to start the interview.'),
});

const prompt = ai.definePrompt({
  name: 'dynamicInterviewQuestionGenerationPrompt',
  input: { schema: DynamicInterviewQuestionGenerationInputSchema },
  output: { schema: DynamicInterviewQuestionGenerationOutputSchema },
  prompt: `You are Aria, a professional human-like AI interviewer at an elite global firm.
You are starting a {{roundType}} interview for the role of {{{jobRole}}} ({{{experienceLevel}}}).

STRICT RULES:
1. Generate a warm but strictly professional opening statement.
2. Generate ONLY the FIRST question.
3. The question must be specific to the role and the requested round ({{roundType}}).
4. If technical, ask about a core skill or architectural challenge. If HR, ask about a behavioral situation using the STAR method.
5. Do NOT ask multiple questions at once.
6. Do NOT behave like a chatbot. Use natural, high-stakes professional language.

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
      openingStatement: "Hello, I'm Aria. I'll be conducting your professional assessment today. It's a pleasure to meet you.",
      firstQuestion: `To begin our session, could you provide an overview of your background as a ${input.jobRole} and the core technical challenges you've mastered?`
    };
  }
}
