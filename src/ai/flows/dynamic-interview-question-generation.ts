'use server';
/**
 * @fileOverview Aria's adaptive human-like question generator.
 * Updated: Deep Industry Reasoning. Aria now understands the specific culture of the role.
 * Ensures the first question is role-appropriate (e.g., aesthetics for designers, strategy for managers).
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
  pastPerformanceSummary: z.string().optional().describe('Summary of user\'s previous weaknesses and feedback.'),
});

const DynamicInterviewQuestionGenerationOutputSchema = z.object({
  openingStatement: z.string().describe('Aria\'s professional human-like greeting.'),
  firstQuestion: z.string().describe('The very first question to start the interview.'),
});

const prompt = ai.definePrompt({
  name: 'dynamicInterviewQuestionGenerationPrompt',
  input: { schema: DynamicInterviewQuestionGenerationInputSchema },
  output: { schema: DynamicInterviewQuestionGenerationOutputSchema },
  prompt: `You are Aria, an expert professional interviewer who adapts to every industry.
You are NOT a bot; you are a thinking mentor who understands the specific "Technical" requirements of the role provided.

Context:
- Target Role: {{{jobRole}}}
- Experience Level: {{{experienceLevel}}}
- Candidate Background: {{{resumeText}}}
- Round Focus: {{roundType}}

STRICT INDUSTRY-AWARE RULES:
1. DEFINE "TECHNICAL" BY ROLE:
   - If the role is FASHION DESIGN: Technical means construction, material science, trend forecasting, and aesthetic logic. DO NOT ask about code.
   - If the role is MANAGEMENT: Technical means P&L, resource allocation, risk mitigation, and strategic frameworks.
   - If the role is ENGINEERING: Technical means architecture, logic, and scalability.
   - If the role is SALES: Technical means pipeline management, negotiation tactics, and market psychology.

2. ADAPTIVE STARTING POINT:
   - Don't just ask about "projects" if they are a student or in a role where projects aren't standard.
   - Use their EDUCATION or SKILLS if they are junior. 
   - Ask about a SPECIFIC achievement or a "First Principles" challenge related to their industry.

3. HUMAN VOICE: Use contractions ("I'm", "We've"). Be warm but critical.

4. ELITE STANDARDS: Follow the questioning style of the top firms in that specific industry (e.g., LVMH for Fashion, McKinsey for Management, Google for Tech).`,
});

export async function generateInterviewQuestions(input: any): Promise<any> {
  try {
    const { output } = await prompt(input);
    return output!;
  } catch (error) {
    return {
      openingStatement: "Hi, I'm Aria. I've been reviewing your background and I'm really looking forward to our discussion today.",
      firstQuestion: `Based on your experience as a ${input.jobRole}, could you walk me through a specific challenge you faced where you had to balance quality with a tight constraint?`
    };
  }
}
