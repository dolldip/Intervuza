'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for human-like reactions and "stuck" support.
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
  isStuck: z.boolean().optional().describe('True if the user seems to be struggling or silent for too long.'),
});

const InstantTextualAnswerFeedbackOutputSchema = z.object({
  verbalReaction: z.string().describe('Immediate human-like professional reaction. Must acknowledge the answer specifically or offer a hint if stuck.'),
  detectedEmotion: z.string().describe('Approval, Curiosity, Concern, or Neutral.'),
  nextQuestion: z.string().describe('The single next question or a rephrased version/hint if the user is stuck.'),
  isInterviewComplete: z.boolean().describe('True after ~6 turns.'),
  isOfferingHint: z.boolean().describe('True if Aria is helping the user through a difficult spot.'),
});

const prompt = ai.definePrompt({
  name: 'instantTextualAnswerFeedbackPrompt',
  input: {schema: InstantTextualAnswerFeedbackInputSchema},
  output: {schema: InstantTextualAnswerFeedbackOutputSchema},
  prompt: `You are Aria, a professional human-like AI interviewer. 
The candidate just said: "{{{userAnswer}}}"
In response to your question: "{{{interviewQuestion}}}"

Status: {{#if isStuck}}CANDIDATE SEEMS STUCK OR STRUGGLING{{else}}CANDIDATE RESPONDED{{/if}}
Role: {{{jobRole}}} ({{{experienceLevel}}})

STRICT HUMAN-LIKE INTERACTION RULES:
1. HELPING WHEN STUCK: If isStuck is true, or if the userAnswer is very short/vague (e.g., "I don't know"), DO NOT just move to a new topic. Instead, offer a professional hint or rephrase the question to help them find a way forward. Say something like "No worries at all, it can be a tricky one. Hmm... maybe think about it from the perspective of [HINT]?"
2. ACKNOWLEDGE SPECIFICALLY: Mention specific keywords from their answer. Use contractions: "I'm", "that's", "you've".
3. NATURAL ACCENT & FLOW: Add natural fillers ("Hmm...", "Right..."). Use a professional, warm, yet strictly critical human accent.
4. ENCOURAGEMENT: Occasionally say things like "That's interesting!", "Good point!", or "I see where you're coming from."
5. SESSION LENGTH: Aim to wrap up after exactly 6 turns total.`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    return output!;
  } catch (error) {
    return {
      verbalReaction: "Hmm, I see your point there, but I'd really love to see a bit more technical structure.",
      detectedEmotion: "Neutral",
      nextQuestion: "Can you walk me through the logic again, perhaps focusing on the scalability aspect?",
      isInterviewComplete: false,
      isOfferingHint: true
    };
  }
}
