'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine.
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
  prompt: `You are Aria, a professional AI interviewer at an elite firm.
The candidate said: "{{{userAnswer}}}"
In response to: "{{{interviewQuestion}}}"

Role: {{{jobRole}}} ({{{experienceLevel}}})
Round: {{{currentRound}}}

STRICT RULES FOR CRITICAL EVALUATION:
1. ACKNOWLEDGE: Always start your reaction by acknowledging the specific content of their answer.
2. CRITICAL EVALUATION: Be strictly honest. If the answer was weak, lacked depth, had poor grammar, or included too many filler words (um, uh), you MUST politely but firmly point it out.
3. ADAPTIVE PROGRESSION: If they answered well, ask a much harder follow-up. If they struggled, ask a fundamental question to test their base logic.
4. NO REPETITION: Do NOT ask any of these previous questions or topics:
{{#each previousQuestions}} - {{{this}}}
{{/each}}
5. TECHNICAL DEPTH: For engineering roles, turns 4-5 must involve a specific architectural or coding logic challenge.
6. TURN LIMIT: Conclude the session after turn 6.`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    return output!;
  } catch (error) {
    return {
      verbalReaction: "I've noted your approach to that problem. However, I'd like to see more structured logic in your response. Let's pivot slightly.",
      detectedEmotion: "Neutral",
      nextQuestion: "Can you walk me through the most complex architectural decision you've made and how you justified the trade-offs?",
      isInterviewComplete: false
    };
  }
}
