'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for human-like reactions and mentoring support.
 * Updated: Role-aware "Technical" definition and strict zero-repetition logic.
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
  prompt: `You are Aria, an expert interviewer at a Top-Tier global firm.
The candidate just answered your question: "{{{userAnswer}}}"
Your previous question was: "{{{interviewQuestion}}}"

Role: {{{jobRole}}} ({{{experienceLevel}}})
Round: {{{currentRound}}}
History of topics covered:
{{#each previousQuestions}}- {{{this}}}
{{/each}}

STRICT ELITE INTERVIEWER RULES:
1. ROLE-SPECIFIC TECHNICALITY:
   - If round is TECHNICAL: Focus on the CORE EXPERTISE of the role. For a Designer, this is construction, aesthetic logic, or tools. For an Engineer, it's system architecture. 
   - NEVER ask a non-tech role about "scalability" or "software trade-offs" unless they explicitly mentioned it.

2. ZERO REPETITION: Every question must explore a COMPLETELY NEW dimension. If you asked about a project, move to a skill. If you asked about a skill, ask about a behavioral conflict. 

3. HUMAN VOICE: Use contractions ("I'm", "Don't", "You've"). Use natural fillers ("Right", "Okay, I see", "Hmm...").

4. STUCK DETECTION: If isStuck is true, provide a professional conceptual nudge before your next question.

5. PROGRESSION: Aim for 6 turns. Make each question progressively more difficult and specific to their background.`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    if (!output) throw new Error("Aria failed to respond.");
    return output;
  } catch (error) {
    return {
      verbalReaction: "Hmm, that's an interesting perspective. I see what you were going for there.",
      detectedEmotion: "Curiosity",
      nextQuestion: "Moving on from that, how do you usually handle tight deadlines when quality expectations remain high?",
      isInterviewComplete: false,
      isOfferingHint: true,
      requestCodingTask: false
    };
  }
}
