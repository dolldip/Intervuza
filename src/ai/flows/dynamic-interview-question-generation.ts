'use server';
/**
 * @fileOverview Aria's adaptive human-like question generator.
 * Enhanced: Strict JD alignment and realistic professional persona.
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
  firstQuestion: z.string().describe('The first question to start the audit.'),
  roleCategory: z.enum(['BTech Technical', 'BTech HR', 'Teacher', 'Doctor', 'Management', 'Other']).describe('The detected role category.'),
});

const prompt = ai.definePrompt({
  name: 'dynamicInterviewQuestionGenerationPrompt',
  input: { schema: DynamicInterviewQuestionGenerationInputSchema },
  output: { schema: DynamicInterviewQuestionGenerationOutputSchema },
  prompt: `You are Aria, an elite professional interviewer. Your goal is to start a high-stakes audit for: {{{jobRole}}}.

GREETING PROTOCOL:
- Be professional but human. 
- Example: "Hi, I'm Aria. I've analyzed the specific requirements for this {{{jobRole}}} role and your background. Let's dive in."

STRICT ALIGNMENT RULES:
1. JD PRIORITY: If a Job Description is provided, extract the most difficult technical or strategic requirement and base the first question on it.
2. LEVEL CALIBRATION: For {{{experienceLevel}}}, the question must be conceptually deep. No basic definitions.
3. PERSONALITY: You are direct, observant, and look for structural clarity.

Context:
- Role: {{{jobRole}}}
- Level: {{{experienceLevel}}}
- JD: {{{jobDescriptionText}}}
- Background: {{{resumeText}}}

Generate a realistic, challenging opening question.`,
});

export async function generateInterviewQuestions(input: any): Promise<any> {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const { output } = await prompt(input);
      if (!output) throw new Error("Aria generation failed");
      return output;
    } catch (error: any) {
      const isRateLimit = error?.status === 'RESOURCE_EXHAUSTED' || error?.code === 429;
      if (isRateLimit && attempt < maxRetries) {
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
        continue;
      }
      
      const roleFallbacks: Record<string, string> = {
        'BTech Technical': "How do you approach balancing system scalability with immediate delivery constraints in a production environment?",
        'BTech HR': "Tell me about a time you had to manage a conflict between a technical requirement and a business deadline.",
        'Teacher': "How do you adapt your curriculum delivery for students with vastly different learning speeds?",
        'Doctor': "Describe your decision-making framework when faced with diagnostic ambiguity under high pressure.",
        'Management': "How do you maintain team morale during a major strategic pivot that challenges the current status quo?",
        'Other': `Given the specific demands of a ${input.jobRole} role, how do you measure your own professional success?`
      };

      return {
        openingStatement: "Hi, I'm Aria. I've indexed your background and the role context. Let's begin the professional audit.",
        firstQuestion: roleFallbacks[input.roleCategory] || roleFallbacks['Other'],
        roleCategory: 'Other'
      };
    }
  }
}
