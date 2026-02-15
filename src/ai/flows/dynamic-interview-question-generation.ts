'use server';
/**
 * @fileOverview Aria's adaptive human-like question generator.
 * Enhanced: Added industry-standard fallback pools and strict JD alignment logic.
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
  openingStatement: z.string().describe('Aria\'s professional human-like greeting. e.g., "Hi, I\'m Aria. I\'ve reviewed your background for the [Role] position..."'),
  firstQuestion: z.string().describe('The very first question to start the interview.'),
  roleCategory: z.enum(['BTech Technical', 'BTech HR', 'Teacher', 'Doctor', 'Management', 'Other']).describe('The category of the role detected.'),
});

const prompt = ai.definePrompt({
  name: 'dynamicInterviewQuestionGenerationPrompt',
  input: { schema: DynamicInterviewQuestionGenerationInputSchema },
  output: { schema: DynamicInterviewQuestionGenerationOutputSchema },
  prompt: `You are Aria, an elite professional interviewer. Your goal is to start a high-stakes interview for the position of: {{{jobRole}}}.

GREETING PROTOCOL:
- Be professional but human. 
- Example: "Hi, I'm Aria. I've analyzed the specific requirements for this {{{jobRole}}} opening and your background. Let's get right into the assessment."

STRICT ALIGNMENT RULES:
1. JOB DESCRIPTION (JD) PRIORITY: If a Job Description is provided below, extract the most critical technical requirement or behavioral competency and base the first question on it.
2. JOB TITLE CONTEXT: If no JD is provided, use the Job Title ({{{jobRole}}}) and Experience Level ({{{experienceLevel}}}) to generate a highly specific industry-standard challenge.
3. ZERO REPETITION: Start with a substantial logic or strategy question.

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
        await new Promise(resolve => setTimeout(resolve, 3500 * attempt));
        continue;
      }
      
      // INDUSTRY-STANDARD FALLBACK DATABASE (100% FREE)
      const roleFallbacks: Record<string, string> = {
        'BTech Technical': "Can you walk me through the most complex architectural trade-off you've had to make in a production environment?",
        'BTech HR': "Tell me about a time you had to deliver critical feedback to a superior. How did you structure the conversation?",
        'Teacher': "How do you handle a situation where a curriculum requirement conflicts with the immediate learning needs of a struggling student?",
        'Doctor': "Describe your protocol for maintaining diagnostic accuracy under extreme fatigue or high-volume stress.",
        'Management': "How do you align a team's day-to-day execution with a long-term strategic pivot that is unpopular with the staff?",
        'Other': `Given the specific challenges associated with a ${input.jobRole} position, how do you approach complex decision-making when faced with incomplete information?`
      };

      return {
        openingStatement: "Hi, I'm Aria. I've reviewed your background and the role context. Let's begin the professional audit.",
        firstQuestion: roleFallbacks[input.roleCategory] || roleFallbacks['Other'],
        roleCategory: 'Other'
      };
    }
  }
}
