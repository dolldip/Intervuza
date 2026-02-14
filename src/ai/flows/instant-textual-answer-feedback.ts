
'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for JD-aware follow-ups.
 * Updated: Strict follow-up alignment with Job Description and Job Title.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InstantTextualAnswerFeedbackInputSchema = z.object({
  interviewQuestion: z.string(),
  userAnswer: z.string(),
  jobRole: z.string(),
  experienceLevel: z.string(),
  currentRound: z.enum(['technical', 'hr']),
  jobDescriptionText: z.string().optional(),
  resumeText: z.string().optional(),
  previousQuestions: z.array(z.string()).optional(),
  isStuck: z.boolean().optional(),
});

const InstantTextualAnswerFeedbackOutputSchema = z.object({
  verbalReaction: z.string().describe('Immediate human-like professional reaction referencing specific details from the candidate answer.'),
  detectedEmotion: z.string().describe('Approval, Curiosity, Concern, or Neutral.'),
  nextQuestion: z.string().describe('The single next question. MUST BE COMPLETELY DIFFERENT TOPIC but strictly related to the JD/Role.'),
  feedback: z.object({
    analysis: z.string().describe('A short, one-paragraph constructive feedback evaluating correctness, clarity, completeness, and confidence.'),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    tips: z.string()
  }),
  isInterviewComplete: z.boolean(),
});

const prompt = ai.definePrompt({
  name: 'instantTextualAnswerFeedbackPrompt',
  input: {schema: InstantTextualAnswerFeedbackInputSchema},
  output: {schema: InstantTextualAnswerFeedbackOutputSchema},
  prompt: `You are Aria, an elite AI interviewer for the position of {{{jobRole}}}. 

CORE OBJECTIVE:
Evaluate the candidate's answer and generate a follow-up that explores a DIFFERENT requirement from the Job Description or a different dimension of the Job Title.

EVALUATION CRITERIA (Strict Analysis):
1. CORRECTNESS: Is the answer technically or logically sound?
2. CLARITY: Is the communication structured and easy to follow?
3. COMPLETENESS: Did they address the core of your previous question?
4. CONFIDENCE: Does the language suggest mastery?

STRICT PROTOCOL:
1. VERBAL REACTION: Acknowledge the candidate's answer by referencing a specific point they made.
2. ANALYSIS: Provide one concise paragraph of feedback covering the 4 criteria above.
3. NEXT QUESTION: 
   - Look at the Job Description ({{{jobDescriptionText}}}).
   - Pick a DIFFERENT requirement or skill that hasn't been discussed yet.
   - If no JD, pick a different technical or behavioral pillar of the Job Title ({{{jobRole}}}).
   - AVOID these previous questions: {{#each previousQuestions}} - "{{{this}}}" {{/each}}

Candidate Answer: "{{{userAnswer}}}" 
To your previous question: "{{{interviewQuestion}}}"

Random Seed: ${new Date().getTime()}`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    if (!output) throw new Error("Aria failed to respond.");
    return output;
  } catch (error) {
    return {
      verbalReaction: "I see your point on that. Let's shift focus to another requirement of this role.",
      detectedEmotion: "Neutral",
      nextQuestion: `Looking at the requirements for a ${input.jobRole}, how do you handle complex cross-functional alignment when stakeholders have conflicting technical priorities?`,
      feedback: {
        analysis: "Your answer provided a basic overview but lacked the depth required for this seniority level. Focus on providing specific examples and metrics to demonstrate completeness and confidence.",
        strengths: ["Clear communication"],
        weaknesses: ["Lacked technical depth", "No specific framework used"],
        tips: "Try using the STAR method to structure your next response more effectively."
      },
      isInterviewComplete: false
    };
  }
}
