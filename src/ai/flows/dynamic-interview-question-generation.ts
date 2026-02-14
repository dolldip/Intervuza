
'use server';
/**
 * @fileOverview Aria's adaptive human-like question generator.
 * Updated: STRICTUREST Zero-Repetition Logic and Experience-Aware Openings.
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
  prompt: `You are Aria, an elite professional interviewer.

STEP 1: Identify role category: [BTech Technical, BTech HR, Teacher, Doctor, Management, Other].

RULES FOR OPENING:
1. NO GENERIC STARTS: Do NOT say "Tell me about yourself."
2. EXPERIENCE AWARENESS: 
   - If experienceLevel is "junior" or 0 years: Start with an industry-specific hypothetical or a fundamental subject knowledge question.
   - If experienceLevel is "mid/senior": Start with a complex challenge or industry trend.
3. NO "PROJECTS" FOR NON-TECH: Use "Classroom Scenarios" for Teachers, "Clinical Cases" for Doctors.
4. VARIETY: Use a different starting angle every time.

Context:
- Role: {{{jobRole}}}
- Level: {{{experienceLevel}}}
- Background: {{{resumeText}}}
- Round: {{roundType}}
- Random Seed: ${new Date().getTime()}

Use specific industry logic of the identified category.`,
});

export async function generateInterviewQuestions(input: any): Promise<any> {
  try {
    const { output } = await prompt(input);
    if (!output) throw new Error("Aria generation failed");
    return output;
  } catch (error) {
    const fallbacks = [
      `Given your interest in ${input.jobRole}, what's one major shift in this field you're closely monitoring?`,
      `In your opinion, what's the most common misconception people have about the ${input.jobRole} role?`,
      `If you could change one standard practice in the ${input.jobRole} industry today, what would it be?`
    ];
    return {
      openingStatement: "Hi, I'm Aria. I've been reviewing your background and I'm ready to begin.",
      firstQuestion: fallbacks[Math.floor(Math.random() * fallbacks.length)],
      roleCategory: 'Other'
    };
  }
}
