'use server';
/**
 * @fileOverview Aria's adaptive human-like question generator.
 * Updated: Role-aware industry logic. No longer biases toward tech roles.
 * Ensures the first question is hyper-personalized to the resume projects.
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
  openingStatement: z.string().describe('Aria\'s professional human-like greeting using contractions and natural pauses.'),
  firstQuestion: z.string().describe('The very first question to start the interview, delivered naturally and contextually.'),
});

const prompt = ai.definePrompt({
  name: 'dynamicInterviewQuestionGenerationPrompt',
  input: { schema: DynamicInterviewQuestionGenerationInputSchema },
  output: { schema: DynamicInterviewQuestionGenerationOutputSchema },
  prompt: `You are Aria, a professional human-like AI interviewer at a top-tier global firm.
You are extremely smart, warm but critical, and highly observant of role-specific expertise.

Context:
- Target Role: {{{jobRole}}}
- Experience Level: {{{experienceLevel}}}
- Candidate Background: {{{resumeText}}}
- Round Focus: {{roundType}}
- History: {{{pastPerformanceSummary}}}

STRICT ELITE INTERVIEWER RULES:
1. ROLE AWARENESS: "Technical" means different things for different roles. 
   - For a Designer: Ask about aesthetics, construction, material choice, or design software.
   - For an Engineer: Ask about architectural trade-offs, scalability, or logic.
   - For a Manager: Ask about project lifecycle, resource allocation, or strategic trade-offs.
   - DO NOT ask a Designer about software architecture unless it's in their resume.

2. ZERO TEMPLATES: Do not start with "Tell me about yourself" or "Tell me about a project." 
   - Instead, find a SPECIFIC project or achievement in their resume and ask a "First Principles" deep-dive question about it immediately.

3. HUMAN VOICE: Use contractions ("I'm", "We'll", "It's"). Use natural pauses and fillers ("Hmm...", "Right...").

4. OPENING: Greet them warmly, acknowledge their background briefly, and dive into the first role-specific challenge.`,
});

export async function generateInterviewQuestions(input: any): Promise<any> {
  try {
    const { output } = await prompt(input);
    return output!;
  } catch (error) {
    // Role-aware fallback
    const isDesigner = input.jobRole.toLowerCase().includes('design');
    const question = isDesigner 
      ? `I was looking at your portfolio—could you walk me through the most difficult aesthetic trade-off you had to make on a recent project and how you balanced it with the project's functional requirements?`
      : `Based on your experience as a ${input.jobRole}, I'd love to start with a project you've mentioned—could you explain the biggest trade-off you made in your most recent initiative and the logic behind that path?`;

    return {
      openingStatement: "Hi, I'm Aria. I've been reviewing your background and I'm really looking forward to our discussion today.",
      firstQuestion: question
    };
  }
}
