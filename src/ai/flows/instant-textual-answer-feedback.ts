
'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for human-like reactions and mentoring support.
 * Updated: Strictly unique questions, project deep-dives, and coding task requests.
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
  nextQuestion: z.string().describe('The single next question. MUST BE DIFFERENT from any in previousQuestions.'),
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
Turn History (DO NOT REPEAT THESE TOPICS):
{{#each previousQuestions}}- {{{this}}}
{{/each}}

STRICT ELITE INTERVIEWER RULES:
1. ZERO REPETITION: Every question must explore a COMPLETELY NEW dimension of the candidate's skills. If you already asked about a project, move to a system design trade-off. If you asked about a skill, ask about a behavioral conflict.
2. PROJECT DEEP DIVE: Reference specific technical details or projects found in the resume. If they mention a skill, ask "How did you apply that in [Project Name from Resume]? What were the constraints?".
3. TOP-COMPANY STANDARDS: Use "First Principles" thinking. Ask "Why?" and "How?" follow-ups. Focus on architectural trade-offs, scalability, and logical rigor.
4. CODING CHALLENGE: If this is a Technical round and they've handled theory well, set requestCodingTask to true and ask them to implement a specific algorithm or logic in the "Logic Pad".
5. STUCK DETECTION: If isStuck is true, or the answer is very short ("I don't know", "Not sure"), set isOfferingHint to true. Provide a professional, high-level conceptual nudge. Don't give the answer.
6. HUMAN BEHAVIOR: Use contractions ("I'm", "Don't", "You've"). Use natural fillers ("Right", "Okay, I see", "Hmm...").
7. VERDICT: Aim for exactly 6 turns. If the candidate is exceptional or failing clearly, you can set isInterviewComplete to true earlier.`
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
