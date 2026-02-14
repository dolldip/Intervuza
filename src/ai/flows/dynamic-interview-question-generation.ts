
'use server';
/**
 * @fileOverview Aria's adaptive human-like question generator.
 * Updated: STRICTUREST Zero-Repetition Logic and Industry-Specific Openings.
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
   - If experienceLevel is "junior" or 0 years: Start with an industry-specific hypothetical or a fundamental subject knowledge challenge.
   - If experienceLevel is "mid/senior": Start with a complex architectural challenge or a high-stakes industry trend.
3. INDUSTRY-SPECIFIC LOGIC:
   - For Teachers: Focus on student engagement or pedagogical shifts.
   - For Doctors: Focus on diagnostic methodology or patient ethics.
   - For BTech: Focus on system architecture or logic trade-offs.
4. VARIETY: Use a unique angle for every session.

Context:
- Role: {{{jobRole}}}
- Level: {{{experienceLevel}}}
- Background: {{{resumeText}}}
- Round: {{roundType}}
- Random Seed: ${new Date().getTime()}

Use specific industry logic of the identified category to create a challenging, realistic opening question.`,
});

export async function generateInterviewQuestions(input: any): Promise<any> {
  try {
    const { output } = await prompt(input);
    if (!output) throw new Error("Aria generation failed");
    return output;
  } catch (error) {
    const fallbacks: Record<string, string[]> = {
      'Teacher': ["How do you handle a student who is consistently disengaged despite various teaching strategies?"],
      'Doctor': ["In a high-pressure diagnostic scenario, how do you prioritize patient safety over speed?"],
      'BTech Technical': ["If you were tasked with optimizing a legacy system for 10x scale, where would you start?"],
      'default': ["Given the current shifts in your industry, what's one legacy practice you think we should abandon?"]
    };
    
    const roleKey = input.jobRole?.includes('Teacher') ? 'Teacher' : 
                    input.jobRole?.includes('Doctor') ? 'Doctor' : 
                    input.jobRole?.includes('BTech') ? 'BTech Technical' : 'default';

    return {
      openingStatement: "Hi, I'm Aria. I've been reviewing your background and I'm ready to begin.",
      firstQuestion: (fallbacks[roleKey] || fallbacks['default'])[0],
      roleCategory: roleKey === 'default' ? 'Other' : roleKey as any
    };
  }
}
