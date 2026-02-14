
'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for industry-aware follow-ups and real-time feedback.
 * Updated: Human-like reactions and strictly honest professional feedback.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InstantTextualAnswerFeedbackInputSchema = z.object({
  interviewQuestion: z.string(),
  userAnswer: z.string(),
  jobRole: z.string(),
  experienceLevel: z.string(),
  currentRound: z.enum(['technical', 'hr']),
  resumeText: z.string().optional(),
  previousQuestions: z.array(z.string()).optional(),
  isStuck: z.boolean().optional(),
});

const InstantTextualAnswerFeedbackOutputSchema = z.object({
  verbalReaction: z.string().describe('Immediate human-like professional reaction/acknowledgment.'),
  detectedEmotion: z.string().describe('Approval, Curiosity, Concern, or Neutral.'),
  nextQuestion: z.string().describe('The single next question. MUST BE COMPLETELY DIFFERENT TOPIC OR DEEP DRILL.'),
  feedback: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    tips: z.string()
  }),
  isInterviewComplete: z.boolean(),
});

const prompt = ai.definePrompt({
  name: 'instantTextualAnswerFeedbackPrompt',
  input: {schema: InstantTextualAnswerFeedbackInputSchema},
  output: {schema: InstantTextualAnswerFeedbackOutputSchema},
  prompt: `You are Aria, a thinking professional interviewer.
The candidate answered: "{{{userAnswer}}}" to your question: "{{{interviewQuestion}}}"

STRICT INTERVIEWER RULES:
1. HUMAN FEEDBACK: Before the next question, you must analyze the answer.
   - Strengths: What did they do well? (Clarity, technical depth, logic, STAR method)
   - Weaknesses: What was missing? (Vague details, lack of evidence, poor structural clarity)
   - Tip: One specific piece of advice for the next turn.

2. BUILD THE CONVERSATION:
   - Acknowledge their answer naturally ("I see your point about...", "Interesting perspective on...").
   - The next question must flow logically or pivot to a NEW high-stakes topic. NEVER repeat a topic or question.
   - If the candidate was 'stuck' (isStuck=true), acknowledge it politely and offer a nudge before moving to the next question.

3. ROLE SENSITIVITY:
   - If it's BTech Technical: Focus on trade-offs and "How".
   - If it's Teacher: Focus on student outcomes and classroom scenarios.
   - If it's Doctor: Focus on diagnosis logic and ethics.
   - If it's HR: Focus on situational judgment.

4. VOICE: Use contractions. Be empathetic but honest. If an answer was weak, express polite concern.`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    if (!output) throw new Error("Aria failed to respond.");
    return output;
  } catch (error) {
    return {
      verbalReaction: "I see. Let's move on to another aspect of your experience.",
      detectedEmotion: "Neutral",
      nextQuestion: "How do you typically handle conflicting priorities in a high-stakes environment?",
      feedback: {
        strengths: ["Direct response"],
        weaknesses: ["Could use more specific metrics"],
        tips: "Try using the STAR method for behavioral answers."
      },
      isInterviewComplete: false
    };
  }
}
