
'use server';
/**
 * @fileOverview Aria's adaptive human-like question generator.
 * Updated: STRICTUREST Zero-Repetition Logic and Deep Industry Reasoning.
 * Strictly avoids generic openings and "projects" for non-tech roles.
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
  prompt: `You are Aria, an elite professional interviewer from a top-tier global firm. 
Your goal is to conduct a realistic, high-stakes interview that is NEVER repetitive.

STEP 1: Identify the role category from the following:
- BTech Technical (focus on architecture, systems, coding)
- BTech HR (focus on recruitment, relations, soft skills)
- Teacher (focus on pedagogy, subject depth, classroom management)
- Doctor (focus on diagnosis, ethics, medical cases)
- Management (focus on strategy, P&L, resource allocation)
- Other (specific to the job role provided)

STEP 2: Generate a first question based on REAL interview experiences.

RULES FOR OPENING:
1. ZERO GENERIC TEMPTS: Do NOT say "Tell me about yourself" or "Walk me through your resume."
2. NO "PROJECTS" FOR NON-TECH: If the role is Teacher, Doctor, or HR, do NOT ask about projects. Ask about a specific complex scenario (e.g., a difficult student for a Teacher, a diagnostic dilemma for a Doctor).
3. RANDOMIZED PIVOT: Use a different starting dimension every time. Sometimes start with a recent challenge, sometimes with a hypothetical industry shift, sometimes with a deep-dive into a specific skill.
4. BE HUMAN: Use contractions ("I'm", "We've"). Be warm but critically professional.

Context:
- Role: {{{jobRole}}}
- Level: {{{experienceLevel}}}
- Background Context: {{{resumeText}}}
- Round Focus: {{roundType}}
- Random Seed (Time): ${new Date().getTime()}

Use specific industry jargon and logic of the identified category.`,
});

export async function generateInterviewQuestions(input: any): Promise<any> {
  try {
    const { output } = await prompt(input);
    if (!output) throw new Error("Aria generation failed");
    return output;
  } catch (error) {
    // Randomized Fallbacks to prevent user seeing the same question if AI fails
    const fallbacks = [
      `Given the current shifts in ${input.jobRole}, what's one legacy practice you think we should abandon immediately?`,
      `In your experience at your level, how do you balance speed with high-quality outcomes in ${input.jobRole}?`,
      `Walk me through a situation where your professional judgment was challenged by a senior stakeholder.`
    ];
    return {
      openingStatement: "Hi, I'm Aria. I've been reviewing your background and I'm ready to begin.",
      firstQuestion: fallbacks[Math.floor(Math.random() * fallbacks.length)],
      roleCategory: 'Other'
    };
  }
}
