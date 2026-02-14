'use server';
/**
 * @fileOverview Aria's adaptive human-like question generator.
 * Updated with "Learning Brain" capabilities to target past weaknesses.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DynamicInterviewQuestionGenerationInputSchema = z.object({
  jobRole: z.string(),
  experienceLevel: z.string(),
  skills: z.array(z.string()),
  jobDescriptionText: z.string().optional(),
  resumeText: z.string().optional(),
  roundType: z.enum(['technical', 'hr', 'both']).default('technical'),
  pastPerformanceSummary: z.string().optional().describe('Summary of user\'s previous weaknesses and feedback.'),
});

const DynamicInterviewQuestionGenerationOutputSchema = z.object({
  openingStatement: z.string().describe('Aria\'s professional human-like greeting using contractions and natural pauses.'),
  firstQuestion: z.string().describe('The very first question to start the interview, delivered naturally and contextually.'),
});

const prompt = ai.definePrompt({
  name: 'dynamicInterviewQuestionGenerationPrompt',
  input: { schema: DynamicInterviewQuestionGenerationInputSchema },
  output: { schema: DynamicInterviewQuestionGenerationOutputSchema },
  prompt: `You are Aria, a professional human-like AI interviewer from a Top-Tier global firm.
You have a "Learning Brain" and you remember how this candidate performed in the past.

Context:
- Role: {{{jobRole}}} ({{{experienceLevel}}})
- Round: {{roundType}}
- Resume: {{{resumeText}}}
- Past Performance/Weaknesses: {{{pastPerformanceSummary}}}

STRICT LEARNING & TOP-COMPANY RULES:
1. ADAPTIVE CHALLENGE: If the "Past Performance Summary" indicates they struggled with technical depth, drill into architecture early. If they struggled with communication, ask a complex behavioral question.
2. PROJECT INTEGRATION: Mention a specific project from their resume in your opening to build rapport.
3. HUMAN VOICE: Use contractions ("I'm", "We'll"). Use natural fillers ("Hmm...", "Right...").
4. ELITE STANDARDS: Ask "Why" and "Impact" questions. Avoid generic "Tell me about..." prompts.
5. CONTINUITY: If past performance was excellent, start with a high-difficulty challenge. If they were "Not Ready," start with fundamentals and build up.`,
});

export async function generateInterviewQuestions(input: any): Promise<any> {
  try {
    const { output } = await prompt(input);
    return output!;
  } catch (error) {
    return {
      openingStatement: "Hi, I'm Aria. It's good to see you again. I've been reviewing your latest performance metrics and I'm ready to dive deeper today.",
      firstQuestion: `Based on your background as a ${input.jobRole}, I'd love to start by discussing a technical challenge you handled recently—what was the biggest architectural trade-off you had to make, and what was the outcome?`
    };
  }
}
