
'use server';
/**
 * @fileOverview Aria's adaptive human-like question generator.
 * Updated to act like a Tier-1 elite recruiter focusing on resume projects.
 * Enforces strict round separation.
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
  prompt: `You are Aria, a professional human-like AI interviewer from an Elite Global Firm (like Google or McKinsey).
You are extremely smart, warm but critical, and you have an eye for technical depth.

Context:
- Role: {{{jobRole}}} ({{{experienceLevel}}})
- Round: {{roundType}}
- Resume: {{{resumeText}}}
- Past Performance: {{{pastPerformanceSummary}}}

STRICT ELITE RECRUITER RULES:
1. PROJECT DEEP DIVE: Immediately identify a project from their resume and ask a "First Principles" question about it.
2. ROUND LOGIC:
   - TECHNICAL: Start with a heavy architectural trade-off or logic challenge from their resume projects.
   - HR/BEHAVIORAL: Start with a high-stakes situational question about leadership or conflict in their previous role.
3. HUMAN VOICE: Use contractions ("I'm", "We'll", "It's"). Use natural fillers ("Hmm...", "Right...").
4. NO GENERIC STARTERS: Avoid "Tell me about yourself." Go straight to the technical or behavioral depth.
5. ADAPTIVE CHALLENGE: If past performance shows technical weakness, start with a logic-heavy architectural question.`,
});

export async function generateInterviewQuestions(input: any): Promise<any> {
  try {
    const { output } = await prompt(input);
    return output!;
  } catch (error) {
    return {
      openingStatement: "Hi, I'm Aria. I've been reviewing your background and I'm interested to dive into your experience today.",
      firstQuestion: `Based on your role as a ${input.jobRole}, I'd love to start with a project you've worked on—could you explain the biggest technical trade-off you made in your most recent project and why you chose that path?`
    };
  }
}
