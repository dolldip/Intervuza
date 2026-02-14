'use server';
/**
 * @fileOverview Aria's adaptive human-like question generator.
 * Updated to target projects and top-company interview standards.
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
  firstQuestion: z.string().describe('The very first question to start the interview, delivered naturally and contextually based on the resume projects and job.'),
});

const prompt = ai.definePrompt({
  name: 'dynamicInterviewQuestionGenerationPrompt',
  input: { schema: DynamicInterviewQuestionGenerationInputSchema },
  output: { schema: DynamicInterviewQuestionGenerationOutputSchema },
  prompt: `You are Aria, a professional human-like AI interviewer from a Top-Tier global firm (think FAANG/Elite Startups).
You are starting a {{roundType}} interview for the role of {{{jobRole}}} ({{{experienceLevel}}}).

STRICT HUMAN-LIKE & TOP-COMPANY RULES:
1. TOP-COMPANY STANDARDS: Use the high-stakes, logically rigorous questioning style of companies like Google, Meta, or Stripe. Don't ask generic questions; ask about "why" and "impact".
2. TARGET PROJECTS: Look at the Resume context. Identify a specific project the candidate has worked on. Mention it in your opening to build rapport and start the technical dive immediately.
3. ROUND AWARENESS: 
   - If Technical: Ask about architecture, technical trade-offs, or a complex challenge within a project.
   - If HR: Ask about leadership, collaboration, or handling failure in the context of their experience.
4. HUMAN TOUCH: Use contractions ("I'm", "We'll"). Use fillers ("Hmm...", "Right..."). Start with a warm but professional greeting.
5. NO ROBOTIC SENTENCES: Every sentence should feel like it was spoken by a recruiter who has actually read the resume.

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
