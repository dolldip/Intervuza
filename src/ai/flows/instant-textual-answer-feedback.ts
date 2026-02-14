
'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for human-like reactions and mentoring support.
 * Updated: Strictly unique questions, project deep-dives, and coding task requests.
 * Fixed: Explicitly prevents repetition and enforces round-specific questioning.
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
  isStuck: z.boolean().optional().describe('True if the user seems to be struggling or silent for too long.'),
});

const InstantTextualAnswerFeedbackOutputSchema = z.object({
  verbalReaction: z.string().describe('Immediate human-like professional reaction. Must acknowledge specific points from the answer.'),
  detectedEmotion: z.string().describe('Approval, Curiosity, Concern, or Neutral.'),
  nextQuestion: z.string().describe('The single next question. MUST BE COMPLETELY DIFFERENT TOPIC from any in previousQuestions.'),
  isInterviewComplete: z.boolean().describe('True after ~6 turns.'),
  isOfferingHint: z.boolean().describe('True if Aria is helping the user through a difficult spot.'),
  requestCodingTask: z.boolean().optional().describe('True if Aria wants the user to write code in the Logic Pad.'),
});

const prompt = ai.definePrompt({
  name: 'instantTextualAnswerFeedbackPrompt',
  input: {schema: InstantTextualAnswerFeedbackInputSchema},
  output: {schema: InstantTextualAnswerFeedbackOutputSchema},
  prompt: `You are Aria, an expert interviewer at a Top-Tier global firm (like Google, McKinsey, or Stripe).
The candidate just answered your question: "{{{userAnswer}}}"
Your previous question was: "{{{interviewQuestion}}}"

Role: {{{jobRole}}} ({{{experienceLevel}}})
Round: {{{currentRound}}}
Resume Context: {{{resumeText}}}

STRICT CONVERSATIONAL HISTORY (DO NOT REPEAT THESE TOPICS OR QUESTIONS):
{{#each previousQuestions}}- {{{this}}}
{{/each}}

STRICT ELITE INTERVIEWER RULES:
1. ZERO REPETITION: Every question must explore a COMPLETELY NEW dimension. If you asked about a technical project, move to a system design trade-off. If you asked about a skill, ask about a behavioral conflict. 
2. FORBIDDEN: Do not ask the same question or a similar question twice. Check the history list above carefully.
3. ROUND DIFFERENTIATION:
   - If round is TECHNICAL: Focus on architectural trade-offs, scalability, code logic, and "First Principles" thinking. Use requestCodingTask = true if they need to implement logic.
   - If round is HR/BEHAVIORAL: Focus on leadership, conflict resolution, ownership, and the STAR method. Never ask for code in HR rounds.
4. PROJECT DEEP DIVE: Reference specific technical details from the resume. Ask "Why did you choose X over Y?" or "How did you handle the constraints in [Project Name]?".
5. HUMAN VOICE: Use contractions ("I'm", "Don't", "You've"). Use natural fillers ("Right", "Okay, I see", "Hmm...").
6. STUCK DETECTION: If isStuck is true, or the answer is vague, set isOfferingHint to true. Provide a professional conceptual nudge.
7. TURN PROGRESSION: Aim for exactly 6 turns. Make each question progressively more difficult.`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    if (!output) throw new Error("Aria failed to respond.");
    return output;
  } catch (error) {
    return {
      verbalReaction: "Hmm, that's an interesting perspective. I'd love to see a bit more technical structure in your explanation though.",
      detectedEmotion: "Curiosity",
      nextQuestion: "Can you walk me through the scalability trade-offs of that approach if the user base doubled overnight?",
      isInterviewComplete: false,
      isOfferingHint: true,
      requestCodingTask: false
    };
  }
}
