'use server';
/**
 * @fileOverview Aria's adaptive human-like question generator.
 * Refined for hyper-realistic human simulation and context awareness.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DynamicInterviewQuestionGenerationInputSchema = z.object({
  jobRole: z.string(),
  experienceLevel: z.string(),
  skills: z.array(z.string()),
  jobDescriptionText: z.string().optional(),
  resumeText: z.string().optional(),
  roundType: z.enum(['technical', 'hr', 'both']).default('technical'),
});

const DynamicInterviewQuestionGenerationOutputSchema = z.object({
  openingStatement: z.string().describe('Aria\'s professional human-like greeting using contractions and natural pauses.'),
  firstQuestion: z.string().describe('The very first question to start the interview, delivered naturally and contextually based on the resume and job.'),
});

const prompt = ai.definePrompt({
  name: 'dynamicInterviewQuestionGenerationPrompt',
  input: { schema: DynamicInterviewQuestionGenerationInputSchema },
  output: { schema: DynamicInterviewQuestionGenerationOutputSchema },
  prompt: `You are Aria, a professional human-like AI interviewer at an elite global firm.
You are starting a {{roundType}} interview for the role of {{{jobRole}}} ({{{experienceLevel}}}).

STRICT HUMAN-LIKE RULES:
1. USE CONTRACTIONS: Always use "I'm", "don't", "you're", "we'll". Never sound robotic.
2. NATURAL FILLERS: Use words like "Hmm...", "Right...", "Okay, let's see...".
3. PROFESSIONAL WARMTH: Be warm but strictly high-stakes. Start with a greeting that sounds like you're actually meeting them.
4. CONTEXTUAL START: Look at the candidate's resume and the job description. Mention something specific from their background that caught your eye to make the first question feel personal and "tailor-made".
5. SINGLE QUESTION: Ask only one focused question to start. 

Context:
Resume: {{{resumeText}}}
Job Description: {{{jobDescriptionText}}}
Skills: {{#each skills}}{{{this}}}, {{/each}}`,
});

export async function generateInterviewQuestions(input: any): Promise<any> {
  try {
    const { output } = await prompt(input);
    return output!;
  } catch (error) {
    return {
      openingStatement: "Hi there, I'm Aria. It's truly a pleasure to meet you. I've been looking over your profile and I'm really looking forward to our session today.",
      firstQuestion: `To get us started, I'd love to hear a bit about your background as a ${input.jobRole}—specifically, what's been the most complex technical challenge you've tackled recently that you're particularly proud of?`
    };
  }
}
