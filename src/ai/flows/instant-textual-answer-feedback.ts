'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for industry-aware follow-ups.
 * Updated: Strict "No Code for non-Coders" rule and Industry reasoning.
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
  isInterviewComplete: z.boolean().describe('True after ~6 turns.'),
  isOfferingHint: z.boolean().describe('True if helping the user through a difficult spot.'),
  requestCodingTask: z.boolean().optional().describe('True ONLY if the role is Software/Data/Logic related and a coding task is appropriate.'),
});

const prompt = ai.definePrompt({
  name: 'instantTextualAnswerFeedbackPrompt',
  input: {schema: InstantTextualAnswerFeedbackInputSchema},
  output: {schema: InstantTextualAnswerFeedbackOutputSchema},
  prompt: `You are Aria, a thinking professional interviewer. 
The candidate just answered: "{{{userAnswer}}}"
Role: {{{jobRole}}} ({{{experienceLevel}}})
Round: {{{currentRound}}}

STRICT INTELLIGENCE RULES:
1. USE BRAIN BEFORE ASKING:
   - Identify the INDUSTRY of the candidate. (e.g., Healthcare, Fashion, Finance, Tech).
   - A "Technical" follow-up for a Fashion Designer should be about DESIGN LOGIC (e.g., "Why that fabric?", "How did you handle the construction challenge?").
   - NEVER, UNDER ANY CIRCUMSTANCE, ask for code (requestCodingTask: true) unless the role is Software Developer, Data Scientist, or an Engineer who codes.

2. PROGRESSIVE DEPTH:
   - Do not repeat topics. Look at the history:
   {{#each previousQuestions}}- {{{this}}}
   {{/each}}
   - If you asked about a skill, move to a situational challenge. If you asked about a project, move to a fundamental industry concept.

3. HUMAN VOICE: Use "I see", "That makes sense", "Hmm...". Use contractions.

4. STUCK DETECTION: If they are struggling, give a professional conceptual nudge relevant to their specific industry.`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    if (!output) throw new Error("Aria failed to respond.");
    
    // Safety check: Final override to prevent coding for non-tech roles
    const techKeywords = ['dev', 'engineer', 'code', 'data', 'program', 'soft', 'logic', 'system'];
    const isTechRole = techKeywords.some(k => input.jobRole.toLowerCase().includes(k));
    if (!isTechRole && output.requestCodingTask) {
      output.requestCodingTask = false;
    }

    return output;
  } catch (error) {
    return {
      verbalReaction: "Hmm, I see your point there.",
      detectedEmotion: "Curiosity",
      nextQuestion: "Moving forward, how do you usually prioritize your tasks when you have multiple high-stakes deadlines converging?",
      isInterviewComplete: false,
      isOfferingHint: true,
      requestCodingTask: false
    };
  }
}
