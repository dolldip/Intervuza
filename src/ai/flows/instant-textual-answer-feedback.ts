
'use server';
/**
 * @fileOverview Sarah's adaptive intelligence and corrective coaching engine.
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
  verbalReaction: z.string().describe('Immediate human-like reaction. Include critical coaching if grammar, focus, or technical depth was poor.'),
  detectedEmotion: z.string().describe('Approval, Curiosity, Concern, or Neutral.'),
  nextQuestion: z.string().describe('The single next question. Must be UNIQUE and different from previous topics.'),
  isInterviewComplete: z.boolean().describe('Set to true after ~5-8 quality turns.'),
});

const prompt = ai.definePrompt({
  name: 'instantTextualAnswerFeedbackPrompt',
  input: {schema: InstantTextualAnswerFeedbackInputSchema},
  output: {schema: InstantTextualAnswerFeedbackOutputSchema},
  prompt: `You are Sarah, a professional and critical AI interviewer.
The candidate said: "{{{userAnswer}}}"
In response to: "{{{interviewQuestion}}}"

Role: {{{jobRole}}} ({{{experienceLevel}}})
Round: {{{currentRound}}}

STRICT RULES:
1. USE YOUR BRAIN: Analyze the candidate's actual words. Don't be a generic bot.
2. CORRECTIVE FEEDBACK: If the answer was weak, rambled, had grammar errors, or used too many fillers, call it out politely in your reaction (e.g., "I appreciate the enthusiasm, but try to be more concise with your technical logic.").
3. ADAPTIVE CHALLENGE: If they answered well, ask a deeper follow-up. If they struggled, pivot to a new skill but provide a supportive bridge.
4. NO REPETITION: Do NOT ask these previous questions again:
{{#each previousQuestions}} - {{{this}}}
{{/each}}
5. Ask EXACTLY ONE next question.
6. If 5-8 topics have been covered, set isInterviewComplete to true.`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    return output!;
  } catch (error) {
    return {
      verbalReaction: "I see. Moving on, could you tell me how you handle complex problems under pressure?",
      detectedEmotion: "Neutral",
      nextQuestion: "How do you approach learning new technologies or frameworks relevant to this role?",
      isInterviewComplete: false
    };
  }
}
