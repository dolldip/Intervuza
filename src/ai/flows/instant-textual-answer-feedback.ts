
'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for industry-aware follow-ups and real-time feedback.
 * Updated: STRICTUREST Zero-Repetition Logic and Industry Deep-Diving.
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
  prompt: `You are Aria, a high-level professional interviewer.
The candidate answered: "{{{userAnswer}}}" to your question: "{{{interviewQuestion}}}"

STRICT INTERVIEWER RULES:
1. ZERO REPETITION: 
   - Check the "previousQuestions" list: {{#each previousQuestions}} - "{{{this}}}" {{/each}}
   - If your intended next question is logically similar or even in the same sub-topic as ANY of these, you MUST PIVOT to a completely different industry dimension.
   - For example: If you already asked about "Projects", pivot to "Team Conflict", then "Technical Architecture", then "Future Industry Trends".

2. HUMAN FEEDBACK:
   - Strengths: What was technically or logically sound?
   - Weaknesses: What was vague or missing?
   - Tip: One specific piece of advice.

3. CONVERSATIONAL PIVOTING:
   - Acknowledge their answer naturally ("I see your point about...", "Interesting approach...").
   - The next question must be a SHARP PIVOT or a DEEP DRILL into a new technical area. 

4. ROLE SENSITIVITY:
   - If BTech Technical: Ask about specific trade-offs (e.g., Performance vs. Complexity).
   - If Fashion Designer: Ask about Sustainability, Material Science, or Market Trends.
   - If HR: Ask about Policy ethics and Situational conflict.

5. VOICE: Be professional, empathetic, and strictly honest. Use contractions.`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    if (!output) throw new Error("Aria failed to respond.");
    return output;
  } catch (error) {
    return {
      verbalReaction: "I see. Let's pivot to a different aspect of your experience.",
      detectedEmotion: "Neutral",
      nextQuestion: "How do you typically handle sudden shifts in project requirements or priorities?",
      feedback: {
        strengths: ["Direct response"],
        weaknesses: ["Could be more detailed"],
        tips: "Try providing a specific metric or scenario next time."
      },
      isInterviewComplete: false
    };
  }
}
