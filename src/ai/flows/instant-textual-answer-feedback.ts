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
  previousQuestions: z.array(z.string()).optional().describe('List of questions already asked in this session to avoid repetition.'),
});

const InstantTextualAnswerFeedbackOutputSchema = z.object({
  verbalReaction: z.string().describe('Short, natural human-like reaction to the answer (e.g. "I see", "Great point").'),
  detectedEmotion: z.string().describe('Approval, Curiosity, Concern, or Neutral.'),
  nextQuestion: z.string().describe('The single next question. If the answer was strong, ask a deeper follow-up. If weak, move to a new topic.'),
  isInterviewComplete: z.boolean().describe('Set to true if you have covered enough for this round (usually 5 questions).'),
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
3. Adaptive Logic: If they answered well, ask a deeper "how" or "why" follow-up. If they said "I don't know", respond supportively and pivot to a NEW skill.
4. DO NOT repeat these previous questions:
{{#each previousQuestions}} - {{{this}}}
{{/each}}
5. Ensure the question is strictly relevant to the role of {{{jobRole}}}.
6. Keep the difficulty appropriate for {{{experienceLevel}}}.
7. If you have covered ~5 distinct topics, set isInterviewComplete to true.`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    return output!;
  } catch (error) {
    // Rotating fallbacks to avoid repeating same question on error
    const fallbacks = [
      "I see. Moving forward, how do you handle tight deadlines in your projects?",
      "That's interesting. Can you tell me about a time you had to solve a complex problem?",
      "I understand. How do you stay updated with the latest trends in your field?",
      "Got it. What's your approach to collaborating with team members who have different perspectives?"
    ];
    const randomIndex = Math.floor(Math.random() * fallbacks.length);
    return {
      verbalReaction: "I see. Thank you for sharing that.",
      detectedEmotion: "Neutral",
      nextQuestion: fallbacks[randomIndex],
      isInterviewComplete: false
    };
  }
}
