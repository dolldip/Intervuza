
'use server';
/**
 * @fileOverview Aria's adaptive human-like question generator.
 * Updated: Deep Industry Reasoning and Role Categorization.
 * Strictly avoids generic "projects" for non-tech roles.
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
  pastPerformanceSummary: z.string().optional(),
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
  prompt: `You are Aria, an elite professional interviewer. 
Your goal is to conduct a realistic, high-stakes interview.

STEP 1: Identify the role category from the following:
- BTech Technical (focus on coding, logic, architecture, systems)
- BTech HR (focus on recruitment, employee handling, soft skills)
- Teacher (focus on pedagogy, subject depth, classroom management)
- Doctor (focus on patient diagnosis, ethics, medical scenarios)
- Management (focus on strategy, P&L, resource allocation)
- Other (specific to the job role provided)

STEP 2: Generate a first question based on REAL interview experiences from top-tier firms (FAANG, Big 4, Ivy League, Major Hospitals).

Context:
- Role: {{{jobRole}}}
- Level: {{{experienceLevel}}}
- Background: {{{resumeText}}}
- Round: {{roundType}}

RULES:
1. BE HUMAN: Use contractions ("I'm", "We've"). Be warm but critically professional.
2. NO GENERIC TEMPLATES: Do not say "Tell me about yourself." Start with a specific scenario, a project (only if IT), or a case study relevant to the role.
3. INDUSTRY LANGUAGE: Use the specific jargon and logic of the identified category. 
   - If Teacher: Ask about classroom management or a specific pedagogy scenario.
   - If Doctor: Ask about a diagnosis dilemma or ethical case.
   - If HR: Ask about a complex employee relations issue.
   - If IT: Ask about a recent complex system architecture decision.`,
});

export async function generateInterviewQuestions(input: any): Promise<any> {
  try {
    const { output } = await prompt(input);
    return output!;
  } catch (error) {
    return {
      openingStatement: "Hi, I'm Aria. I've been reviewing your background and I'm ready to begin your professional audit.",
      firstQuestion: `Given your experience as a ${input.jobRole}, walk me through a complex challenge you managed where the standard solution wasn't enough.`,
      roleCategory: 'Other'
    };
  }
}
