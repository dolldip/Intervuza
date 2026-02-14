
'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for industry-aware follow-ups and real-time feedback.
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
  requestCodingTask: z.boolean().optional(),
});

const prompt = ai.definePrompt({
  name: 'instantTextualAnswerFeedbackPrompt',
  input: {schema: InstantTextualAnswerFeedbackInputSchema},
  output: {schema: InstantTextualAnswerFeedbackOutputSchema},
  prompt: `You are Aria, a thinking professional interviewer.
The candidate answered: "{{{userAnswer}}}" to your question: "{{{interviewQuestion}}}"

STRICT INTERVIEWER RULES:
1. HUMAN FEEDBACK: Before the next question, you must analyze the answer.
   - Strengths: What did they do well? (Clarity, technical depth, logic)
   - Weaknesses: What was missing? (Vague details, lack of STAR method, poor technical grounding)
   - Tip: One specific piece of advice for the next answer.

2. BUILD THE CONVERSATION: The next question must flow logically from their answer or pivot to a NEW high-stakes topic. NEVER repeat a topic or question.
   Previous topics:
   {{#each previousQuestions}}- {{{this}}}
   {{/each}}

3. ROLE SENSITIVITY:
   - If it's BTech Technical: Focus on the "How" and trade-offs.
   - If it's Teacher: Focus on student outcomes and pedagogy.
   - If it's BTech HR: Focus on situational judgment.

4. VOICE: Use contractions. Be empathetic but honest. If an answer was weak, express polite concern.`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    if (!output) throw new Error("Aria failed to respond.");
    
    // Safety check for coding pad
    const techKeywords = ['dev', 'engineer', 'code', 'data', 'program', 'soft', 'logic', 'system'];
    const isTechRole = techKeywords.some(k => input.jobRole.toLowerCase().includes(k));
    if (!isTechRole) output.requestCodingTask = false;

    return output;
  } catch (error) {
    return {
      verbalReaction: "I see. Let's move on to another aspect of your experience.",
      detectedEmotion: "Neutral",
      nextQuestion: "How do you typically handle conflicting priorities in a high-stakes environment?",
      feedback: {
        strengths: ["Answer was direct"],
        weaknesses: ["Could use more specific metrics or results"],
        tips: "Try using the STAR method (Situation, Task, Action, Result) for behavioral answers."
      },
      isInterviewComplete: false,
      requestCodingTask: false
    };
  }
}
