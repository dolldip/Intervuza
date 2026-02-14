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
  verbalReaction: z.string().describe('Immediate human-like professional reaction. Must acknowledge the answer specifically and use contractions.'),
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
1. ACKNOWLEDGE SPECIFICALLY: Don't just say "Good answer." Mention something specific they said. "I like your point about [X]..." or "It's interesting how you approached [Y]...".
2. USE CONTRACTIONS: "I'm", "that's", "you've", "we're". Never use "I am" or "You are".
3. NATURAL SPEECH: Add natural fillers if appropriate ("Hmm...", "Right...").
4. CRITICAL AUDIT: Be strictly honest. If the answer lacked technical depth or had poor structure, politely mention it as a point of feedback before moving to the next question.
5. ADAPTIVE PROGRESSION: If they did well, ask a much tougher follow-up. If they struggled, dig into the fundamentals.
6. NO REPETITION: Don't repeat topics from:
{{#each previousQuestions}} - {{{this}}}
{{/each}}
7. SESSION LENGTH: Aim to wrap up after exactly 6 turns total.`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    return output!;
  } catch (error) {
    return {
      verbalReaction: "Hmm, I see your approach there. It's an interesting way to look at it, though I'd really love to see a bit more technical structure in how you explain those bottlenecks.",
      detectedEmotion: "Neutral",
      nextQuestion: "Can you walk me through how you'd handle a major architectural bottleneck in that specific scenario?",
      isInterviewComplete: false
    };
  }
}
