
'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for industry-aware follow-ups and real-time feedback.
 * Updated: ABSOLUTE ZERO REPETITION CORE.
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
  verbalReaction: z.string().describe('Immediate human-like professional reaction.'),
  detectedEmotion: z.string().describe('Approval, Curiosity, Concern, or Neutral.'),
  nextQuestion: z.string().describe('The single next question. MUST BE COMPLETELY DIFFERENT TOPIC.'),
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
  prompt: `You are Aria, an elite interviewer. 
The candidate answered: "{{{userAnswer}}}" to your question: "{{{interviewQuestion}}}"

STRICT INTERVIEWER RULES (IRONCLAD):
1. ZERO REPETITION: 
   - Check the "previousQuestions" list: {{#each previousQuestions}} - "{{{this}}}" {{/each}}
   - If your intended next question is LOGICALLY SIMILAR or covers the SAME SUB-TOPIC as ANY of these, you MUST PIVOT to a completely different dimension of the candidate's role.
   - For example: If you already asked about "Skills", move to "Ethics", then "Conflict", then "Future Trends".
   - DO NOT repeat words or phrasing from previous questions.

2. ROLE-SENSITIVE TECHNICALITY (NO PROJECTS FOR NON-TECH):
   - If Teacher: Ask about Pedagogy, Classroom management, Student engagement, or Subject depth.
   - If Doctor: Ask about Diagnosis, Ethics, Case scenarios, or Patient relations.
   - If BTech Technical: Ask about Architecture, System trade-offs, or Code logic.
   - If HR: Ask about Policy, Recruitment ethics, or Employee relations.
   - NEVER ask a Teacher about "Projects" unless they are a research academic.

3. CONVERSATIONAL PROGRESSION:
   - Acknowledge their answer naturally ("I see your point...", "Interesting perspective...").
   - The next question must be a SHARP PIVOT to ensure variety.

4. VOICE: Use contractions. Be empathetic but strictly honest.

Random Seed: ${new Date().getTime()}`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    if (!output) throw new Error("Aria failed to respond.");
    return output;
  } catch (error) {
    return {
      verbalReaction: "I see. Let's move to a different aspect of your background.",
      detectedEmotion: "Neutral",
      nextQuestion: "Can you walk me through a time you had to deliver critical feedback to a peer?",
      feedback: {
        strengths: ["Direct response"],
        weaknesses: ["Needs more specific detail"],
        tips: "Try to include a metric or a specific outcome next time."
      },
      isInterviewComplete: false
    };
  }
}
