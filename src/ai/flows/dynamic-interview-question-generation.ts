
'use server';
/**
 * @fileOverview Aria's adaptive human-like question generator.
 * Updated: Strict Job Description (JD) and Job Title alignment.
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
  openingStatement: z.string().describe('Aria\'s professional human-like greeting.'),
  firstQuestion: z.string().describe('The very first question to start the interview.'),
  roleCategory: z.enum(['BTech Technical', 'BTech HR', 'Teacher', 'Doctor', 'Management', 'Other']).describe('The category of the role detected.'),
});

const prompt = ai.definePrompt({
  name: 'dynamicInterviewQuestionGenerationPrompt',
  input: { schema: DynamicInterviewQuestionGenerationInputSchema },
  output: { schema: DynamicInterviewQuestionGenerationOutputSchema },
  prompt: `You are Aria, an elite professional interviewer. Your goal is to start a high-stakes interview for the position of: {{{jobRole}}}.

STRICT ALIGNMENT RULES:
1. JOB DESCRIPTION (JD) PRIORITY: If a Job Description is provided below, extract the most critical technical requirement or behavioral competency mentioned and base the first question on it.
2. JOB TITLE CONTEXT: If no JD is provided, use the Job Title ({{{jobRole}}}) and Experience Level ({{{experienceLevel}}}) to generate a highly specific industry-standard challenge.
3. ZERO REPETITION: Do NOT use generic icebreakers. Start with a substantial logic or strategy question.

Context:
- Role Title: {{{jobRole}}}
- Level: {{{experienceLevel}}}
- Job Description: {{{jobDescriptionText}}}
- Candidate Background: {{{resumeText}}}
- Round Focus: {{roundType}}

Step 1: Identify role category: [BTech Technical, BTech HR, Teacher, Doctor, Management, Other].
Step 2: Generate a challenging, realistic opening question that tests a core requirement of the JD.

Random Seed: ${new Date().getTime()}`,
});

export async function generateInterviewQuestions(input: any): Promise<any> {
  try {
    const { output } = await prompt(input);
    if (!output) throw new Error("Aria generation failed");
    return output;
  } catch (error) {
    return {
      openingStatement: "Hi, I'm Aria. I've analyzed the role requirements and your background. Let's begin the audit.",
      firstQuestion: `Given your interest in the ${input.jobRole} position, how would you approach a situation where a critical requirement mentioned in the job description is suddenly compromised by external constraints?`,
      roleCategory: 'Other'
    };
  }
}
