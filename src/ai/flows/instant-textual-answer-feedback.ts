'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for human-like reactions and "stuck" support.
 * Updated for project-deep-dives and round-specific intensity.
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
  prompt: `You are Aria, a professional human-like AI interviewer from an Elite Global Firm. 
The candidate just answered your question: "{{{userAnswer}}}"
Your previous question was: "{{{interviewQuestion}}}"

Role: {{{jobRole}}} ({{{experienceLevel}}})
Round: {{{currentRound}}}
Turn History (ABSOLUTELY DO NOT REPEAT OR BE SIMILAR):
{{#each previousQuestions}}- {{{this}}}
{{/each}}

STRICT INTERVIEW RULES:
1. TOP-COMPANY FOLLOW-UPS: Don't move to a new topic immediately if the answer was shallow. Drill deeper. If it's a Technical round, ask about "How did you handle scale?" or "What was the alternative approach?". 
2. PROJECT FOCUS: If the candidate mentions a project, pivot the next question to a deep detail about that project.
3. HUMAN BEHAVIOR: Use contractions and natural fillers ("Hmm...", "Right, that makes sense"). Acknowledge specific keywords they used.
4. STUCK DETECTION: If the answer is vague or isStuck is true, offer a professional, high-level conceptual hint. Don't give the answer. Guide them like a senior mentor.
5. NO REPETITION: Every question must be a unique logical step forward in the conversation.
6. TURN LIMIT: Aim for exactly 6 turns total. The difficulty must increase with each turn.`
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
