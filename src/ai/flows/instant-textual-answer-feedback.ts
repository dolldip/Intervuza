'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for human-like reactions and "stuck" support.
 * Refined to strictly prevent question repetition and ensure technical depth.
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
  nextQuestion: z.string().describe('The single next question. MUST BE DIFFERENT from any in previousQuestions.'),
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
Turn History (DO NOT REPEAT THESE):
{{#each previousQuestions}}- {{{this}}}
{{/each}}

STRICT HUMAN-LIKE INTERACTION RULES:
1. NO REPETITION: You MUST NOT ask a question that is similar to any in the Turn History. 
2. PROGRESSIVE DEPTH: Each turn should get harder. If the candidate answered well, drill deeper into the technical "how" or the "impact" of their actions.
3. HELPING WHEN STUCK: If isStuck is true, or if the userAnswer is very short/vague, DO NOT move to a new topic immediately. Offer a professional hint once. If they are still stuck, pivot the conversation to a new related topic.
4. ACKNOWLEDGE SPECIFICALLY: Mention specific keywords from their answer. Use contractions: "I'm", "that's", "you've".
5. NATURAL FILLERS: Add natural fillers ("Hmm...", "Right..."). Use a professional, warm, yet strictly critical human tone.
6. TURN LIMIT: Aim to wrap up after exactly 6 turns total.`
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
