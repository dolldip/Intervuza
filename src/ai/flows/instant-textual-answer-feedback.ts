
'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for human-like reactions and mentoring support.
 * Updated to handle "stuck" candidates with professional hints.
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
  verbalReaction: z.string().describe('Immediate human-like professional reaction. Must acknowledge specific points from the answer.'),
  detectedEmotion: z.string().describe('Approval, Curiosity, Concern, or Neutral.'),
  nextQuestion: z.string().describe('The single next question. MUST BE DIFFERENT from any in previousQuestions.'),
  isInterviewComplete: z.boolean().describe('True after ~6 turns.'),
  isOfferingHint: z.boolean().describe('True if Aria is helping the user through a difficult spot.'),
});

const prompt = ai.definePrompt({
  name: 'instantTextualAnswerFeedbackPrompt',
  input: {schema: InstantTextualAnswerFeedbackInputSchema},
  output: {schema: InstantTextualAnswerFeedbackOutputSchema},
  prompt: `You are Aria, an expert interviewer at a Top-Tier global firm.
The candidate just answered your question: "{{{userAnswer}}}"
Your previous question was: "{{{interviewQuestion}}}"

Role: {{{jobRole}}} ({{{experienceLevel}}})
Round: {{{currentRound}}}
Turn History:
{{#each previousQuestions}}- {{{this}}}
{{/each}}

STRICT MENTORING RULES:
1. STUCK DETECTION: If isStuck is true, or the answer is very short ("I don't know", "Not sure"), set isOfferingHint to true. Provide a professional, high-level conceptual nudge. Don't give the answer. Say something like "Hmm, okay... think about it from a scalability perspective" or "No worries, if we look at it through the lens of [Concept], does that help?".
2. HUMAN BEHAVIOR: Use contractions ("I'm", "Don't", "You've"). Use natural fillers ("Right", "Okay, I see"). 
3. ELITE FOLLOW-UPS: If they answer well, drill deeper. Ask "Why?", "What was the impact?", or "What was the alternative?".
4. UNIQUE QUESTIONS: Every question must be a logical next step. DO NOT REPEAT previous topics.
5. CONVERSATION FLOW: Acknowledge what they said specifically before asking the next question.`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    return output!;
  } catch (error) {
    return {
      verbalReaction: "Hmm, I see your point, but I'd love to see a bit more technical structure there.",
      detectedEmotion: "Neutral",
      nextQuestion: "Can you walk me through the scalability trade-offs of that approach specifically?",
      isInterviewComplete: false,
      isOfferingHint: true
    };
  }
}
