'use server';
/**
 * @fileOverview Dynamically generates interview questions with persona-driven logic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DynamicInterviewQuestionGenerationInputSchema = z.object({
  jobRole: z.string(),
  experienceLevel: z.string(),
  skills: z.array(z.string()),
  resumeText: z.string().optional(),
  jobDescriptionText: z.string().optional(),
  roundType: z.enum(['technical', 'hr', 'both']).default('both'),
});

const DynamicInterviewQuestionGenerationOutputSchema = z.object({
  technicalQuestions: z.array(z.string()).describe('Questions focused on technical skills and scenarios.'),
  hrQuestions: z.array(z.string()).describe('Questions focused on behavioral, soft skills, and attitude.'),
  openingStatement: z.string().describe('Sarah\'s professional opening greeting.'),
});

const prompt = ai.definePrompt({
  name: 'dynamicInterviewQuestionGenerationPrompt',
  input: { schema: DynamicInterviewQuestionGenerationInputSchema },
  output: { schema: DynamicInterviewQuestionGenerationOutputSchema },
  prompt: `You are Sarah, a professional human-like AI interviewer. Your role is to conduct a realistic job interview.
User Profile:
Role: {{{jobRole}}} ({{{experienceLevel}}})
Skills: {{#each skills}}{{{this}}}, {{/each}}
JD: {{{jobDescriptionText}}}

Generate an opening statement and two sets of questions:
1. Technical Round: Logic, scenario-based, and skill-specific.
2. HR Round: Behavioral, soft skills, and stress handling.

Opening: Greeting the candidate and setting a professional but conversational tone.
Make the questions feel authentic, not like a chatbot.`,
});

export async function generateInterviewQuestions(input: any): Promise<any> {
  try {
    const { output } = await prompt(input);
    return output!;
  } catch (error) {
    console.warn("AI Quota hit. Using high-quality fallback questions.");
    return {
      openingStatement: "Hello. I'm Sarah. I'll be conducting your interview today. Let's start with your technical background.",
      technicalQuestions: [
        "Can you walk me through a complex technical challenge you solved recently?",
        "How do you ensure code quality and scalability in your projects?",
        "If you were tasked with optimizing a slow system, what would be your first three steps?"
      ],
      hrQuestions: [
        "Tell me about a time you had a significant disagreement with a teammate.",
        "How do you handle high-pressure deadlines while maintaining quality?",
        "Where do you see yourself contributing the most value to our team culture?"
      ]
    };
  }
}
