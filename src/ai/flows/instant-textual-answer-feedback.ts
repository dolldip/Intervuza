'use server';
/**
 * @fileOverview Sarah's real-time verbal reactions and adaptive follow-up logic.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InstantTextualAnswerFeedbackInputSchema = z.object({
  interviewQuestion: z.string(),
  userAnswer: z.string(),
  jobRole: z.string().optional(),
  currentRound: z.enum(['technical', 'hr']).optional(),
});

const InstantTextualAnswerFeedbackOutputSchema = z.object({
  verbalReaction: z.string().describe('What Sarah says immediately after the candidate finishes (short, natural).'),
  isStrongAnswer: z.boolean(),
  suggestedFollowUp: z.string().optional().describe('A spontaneous follow-up question if the answer was particularly interesting or weak.'),
  detectedEmotion: z.string().describe('The emotion Sarah should portray in response.'),
});

const prompt = ai.definePrompt({
  name: 'instantTextualAnswerFeedbackPrompt',
  input: {schema: InstantTextualAnswerFeedbackInputSchema},
  output: {schema: InstantTextualAnswerFeedbackOutputSchema},
  prompt: `You are Sarah, a professional human-like AI interviewer.
The candidate just answered: "{{{userAnswer}}}"
To the question: "{{{interviewQuestion}}}"

Your task is to:
1. Provide a natural, conversational verbal reaction (e.g., "That's an interesting approach," or "I see, could you elaborate on that part?").
2. Decide if you need a spontaneous follow-up to test their depth or if we should move on.
3. Portray an emotion (Approval, Curiosity, Concern, or Neutral) based on their logic and tone.

Round: {{{currentRound}}}
Role: {{{jobRole}}}

Keep the reaction short and human-like.`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    return output!;
  } catch (error) {
    return {
      verbalReaction: "I see. Thank you for sharing that.",
      isStrongAnswer: true,
      suggestedFollowUp: undefined,
      detectedEmotion: "Neutral"
    };
  }
}
