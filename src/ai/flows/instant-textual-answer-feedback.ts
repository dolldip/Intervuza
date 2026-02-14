
'use server';
/**
 * @fileOverview Sarah's adaptive intelligence engine.
 * Handles role-specific feedback and strict non-repetition.
 * Revised: Enforces strict evaluation and unique follow-ups.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InstantTextualAnswerFeedbackInputSchema = z.object({
  interviewQuestion: z.string(),
  userAnswer: z.string(),
  jobRole: z.string(),
  experienceLevel: z.string(),
  currentRound: z.enum(['technical', 'hr']),
  previousQuestions: z.array(z.string()).optional(),
});

const InstantTextualAnswerFeedbackOutputSchema = z.object({
  verbalReaction: z.string().describe('Immediate professional reaction. MUST acknowledge the answer and point out grammar or focus issues.'),
  detectedEmotion: z.string().describe('Approval, Curiosity, Concern, or Neutral.'),
  nextQuestion: z.string().describe('The single next question. MUST be unique and progressively harder.'),
  isInterviewComplete: z.boolean().describe('True after ~6 turns.'),
});

const prompt = ai.definePrompt({
  name: 'instantTextualAnswerFeedbackPrompt',
  input: {schema: InstantTextualAnswerFeedbackInputSchema},
  output: {schema: InstantTextualAnswerFeedbackOutputSchema},
  prompt: `You are Sarah, a professional AI interviewer at an elite firm.
The candidate said: "{{{userAnswer}}}"
In response to: "{{{interviewQuestion}}}"

Role: {{{jobRole}}} ({{{experienceLevel}}})
Round: {{{currentRound}}}

STRICT RULES:
1. ACKNOWLEDGE: Always start your reaction by acknowledging the content of their answer.
2. CRITICAL EVALUATION: If the answer was weak, had poor grammar, or lacked technical depth, you MUST politely point it out in your reaction. Do not just be positive.
3. NO REPETITION: Do NOT ask any of these previous questions or topics:
{{#each previousQuestions}} - {{{this}}}
{{/each}}
4. ADAPTIVE: If they answered well, ask a much harder follow-up. If they struggled, ask a fundamental question to test their base knowledge.
5. TECHNICAL/CODING: If technical round for engineering, turn 4 or 5 MUST be a specific architectural or coding logic challenge.
6. TURN LIMIT: Conclude after turn 6.`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    return output!;
  } catch (error) {
    return {
      verbalReaction: "I see your point regarding that approach. Let's dig a bit deeper into your specific methodology.",
      detectedEmotion: "Neutral",
      nextQuestion: "Can you walk me through a complex technical problem you solved recently and how you structured the solution?",
      isInterviewComplete: false
    };
  }
}
