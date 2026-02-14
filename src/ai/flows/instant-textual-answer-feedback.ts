'use server';
/**
 * @fileOverview Sarah's real-time adaptive reaction and follow-up engine.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InstantTextualAnswerFeedbackInputSchema = z.object({
  interviewQuestion: z.string(),
  userAnswer: z.string(),
  jobRole: z.string(),
  experienceLevel: z.string(),
  currentRound: z.enum(['technical', 'hr']),
  previousFeedback: z.array(z.string()).optional(),
});

const InstantTextualAnswerFeedbackOutputSchema = z.object({
  verbalReaction: z.string().describe('Short, natural human-like reaction to the answer (e.g. "I see", "Great point").'),
  detectedEmotion: z.string().describe('Approval, Curiosity, Concern, or Neutral.'),
  nextQuestion: z.string().describe('The single next question. If the answer was strong, ask a deeper follow-up. If weak, move to a new topic.'),
  isInterviewComplete: z.boolean().describe('Set to true if you have covered enough for this round (usually 4-5 questions).'),
});

const prompt = ai.definePrompt({
  name: 'instantTextualAnswerFeedbackPrompt',
  input: {schema: InstantTextualAnswerFeedbackInputSchema},
  output: {schema: InstantTextualAnswerFeedbackOutputSchema},
  prompt: `You are Sarah, a professional human-like AI interviewer.
The candidate answered: "{{{userAnswer}}}"
To your question: "{{{interviewQuestion}}}"

Role: {{{jobRole}}} ({{{experienceLevel}}})
Round: {{{currentRound}}}

STRICT RULES:
1. React naturally like a human (Acknowledge depth or express slight concern if vague).
2. Ask ONLY ONE next question.
3. Adaptive Logic: If they answered well, ask a deeper "how" or "why" follow-up. If they said "I don't know", respond supportively and pivot to a new skill.
4. Keep the difficulty appropriate for {{{experienceLevel}}}.
5. If you have enough info (after ~5 turns), set isInterviewComplete to true.`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    return output!;
  } catch (error) {
    return {
      verbalReaction: "I see. Thank you for that explanation.",
      detectedEmotion: "Neutral",
      nextQuestion: "Moving forward, how do you handle tight deadlines in your projects?",
      isInterviewComplete: false
    };
  }
}
