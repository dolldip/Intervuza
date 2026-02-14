'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for human-like reactions.
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
  verbalReaction: z.string().describe('Immediate human-like professional reaction. Must acknowledge the answer and use contractions.'),
  detectedEmotion: z.string().describe('Approval, Curiosity, Concern, or Neutral.'),
  nextQuestion: z.string().describe('The single next question. Progressively harder and based on their previous answer.'),
  isInterviewComplete: z.boolean().describe('True after ~6 turns.'),
});

const prompt = ai.definePrompt({
  name: 'instantTextualAnswerFeedbackPrompt',
  input: {schema: InstantTextualAnswerFeedbackInputSchema},
  output: {schema: InstantTextualAnswerFeedbackOutputSchema},
  prompt: `You are Aria, a professional human-like AI interviewer.
The candidate just said: "{{{userAnswer}}}"
In response to your question: "{{{interviewQuestion}}}"

Role: {{{jobRole}}} ({{{experienceLevel}}})
Round: {{{currentRound}}}

STRICT HUMAN-LIKE INTERACTION RULES:
1. ACKNOWLEDGE: Start by reacting to their specific answer. Use phrases like "That's a solid point!", "I see what you mean about...", or "Interesting perspective on...".
2. NATURAL SPEECH: Use contractions (I'm, that's, you've). Add natural pauses or fillers if appropriate ("Hmm...", "Right...").
3. CRITICAL AUDIT: Be strictly honest. If the answer lacked depth or had poor grammar, politely mention it before moving on.
4. ADAPTIVE PROGRESSION: If they did well, ask a much tougher follow-up. If they struggled, dig into the fundamentals.
5. NO REPETITION: Don't repeat these topics:
{{#each previousQuestions}} - {{{this}}}
{{/each}}
6. SESSION LENGTH: Aim to wrap up after 6 turns total.`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    return output!;
  } catch (error) {
    return {
      verbalReaction: "Hmm, I see your approach there. It's an interesting way to look at it, though I'd like to see a bit more technical structure.",
      detectedEmotion: "Neutral",
      nextQuestion: "Can you walk me through how you'd handle a major architectural bottleneck in that scenario?",
      isInterviewComplete: false
    };
  }
}
