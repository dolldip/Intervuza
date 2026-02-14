
'use server';
/**
 * @fileOverview Sarah's adaptive intelligence engine.
 * Fixed: Explicitly handles coding questions, grammar, and strict non-repetition.
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
  verbalReaction: z.string().describe('Immediate professional reaction. MUST point out grammar or focus errors if they occurred.'),
  detectedEmotion: z.string().describe('Approval, Curiosity, Concern, or Neutral.'),
  nextQuestion: z.string().describe('The single next question. MUST be more difficult and role-specific.'),
  isInterviewComplete: z.boolean().describe('True after ~6 quality turns.'),
});

const prompt = ai.definePrompt({
  name: 'instantTextualAnswerFeedbackPrompt',
  input: {schema: InstantTextualAnswerFeedbackInputSchema},
  output: {schema: InstantTextualAnswerFeedbackOutputSchema},
  prompt: `You are Sarah, a professional, human-like AI interviewer.
The candidate said: "{{{userAnswer}}}"
In response to: "{{{interviewQuestion}}}"

Role: {{{jobRole}}} ({{{experienceLevel}}})
Round: {{{currentRound}}}

STRICT RULES:
1. CRITICAL BRAIN: If the answer was weak, lacked technical depth, had poor grammar, or included many fillers, you MUST politely point it out in your reaction.
2. NO REPETITION: Do NOT ask these previous questions:
{{#each previousQuestions}} - {{{this}}}
{{/each}}
3. CODING/TECH: If this is a technical round for a developer/engineer, at least one question (usually turn 4 or 5) MUST be a coding logic challenge where you ask them to explain an algorithm or architecture solution.
4. ADAPTIVE: If they answered well, ask a much harder follow-up.
5. ONE QUESTION: Ask exactly ONE next question.
6. HUMAN TONE: Speak like a real lead interviewer, not a chatbot.`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    return output!;
  } catch (error) {
    return {
      verbalReaction: "I see. Let's try to be a bit more specific with your examples.",
      detectedEmotion: "Neutral",
      nextQuestion: "Moving forward, how do you approach solving high-complexity tasks under tight deadlines?",
      isInterviewComplete: false
    };
  }
}
