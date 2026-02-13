'use server';
/**
 * @fileOverview Provides immediate, specific feedback on a candidate's interview answer, focusing on relevance, structure, and clarity, along with an improved sample answer.
 *
 * - instantTextualAnswerFeedback - A function that handles the textual answer feedback process.
 * - InstantTextualAnswerFeedbackInput - The input type for the instantTextualAnswerFeedback function.
 * - InstantTextualAnswerFeedbackOutput - The return type for the instantTextualAnswerFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InstantTextualAnswerFeedbackInputSchema = z.object({
  interviewQuestion: z.string().describe('The interview question asked.'),
  userAnswer: z.string().describe('The candidate\u0027s answer to the interview question.'),
  jobRole: z.string().optional().describe('The job role the candidate is interviewing for, if available.'),
  jobDescription: z.string().optional().describe('The job description for context, if available.'),
});
export type InstantTextualAnswerFeedbackInput = z.infer<typeof InstantTextualAnswerFeedbackInputSchema>;

const InstantTextualAnswerFeedbackOutputSchema = z.object({
  relevanceFeedback: z
    .string()
    .describe('Feedback on the relevance of the answer to the question and job role.'),
  structureFeedback: z
    .string()
    .describe('Feedback on the structure and logical flow of the answer.'),
  clarityFeedback: z
    .string()
    .describe('Feedback on the clarity, conciseness, and comprehensibility of the answer.'),
  improvedSampleAnswer: z
    .string()
    .describe('An improved sample answer that is relevant, well-structured, and clear.'),
});
export type InstantTextualAnswerFeedbackOutput = z.infer<
  typeof InstantTextualAnswerFeedbackOutputSchema
>;

export async function instantTextualAnswerFeedback(
  input: InstantTextualAnswerFeedbackInput
): Promise<InstantTextualAnswerFeedbackOutput> {
  return instantTextualAnswerFeedbackFlow(input);
}

const instantTextualAnswerFeedbackPrompt = ai.definePrompt({
  name: 'instantTextualAnswerFeedbackPrompt',
  input: {schema: InstantTextualAnswerFeedbackInputSchema},
  output: {schema: InstantTextualAnswerFeedbackOutputSchema},
  prompt: `You are an expert interview coach specialized in providing immediate, constructive feedback.
Your task is to analyze a candidate's answer to an interview question and provide specific feedback on its relevance, structure, and clarity.
Additionally, you must provide an improved sample answer.

Here is the interview context:
{{#if jobRole}}
Job Role: {{{jobRole}}}
{{/if}}
{{#if jobDescription}}
Job Description: {{{jobDescription}}}
{{/if}}
Interview Question: {{{interviewQuestion}}}
Candidate's Answer: {{{userAnswer}}}

Based on the above, provide your analysis and an improved sample answer, following these guidelines:
1.  **Relevance Feedback**: Evaluate how well the answer directly addresses the question and aligns with the requirements of the specified job role (if provided).
2.  **Structure Feedback**: Assess the organization and flow of the answer. Does it have a clear beginning, middle, and end? Is it easy to follow?
3.  **Clarity Feedback**: Comment on the answer's conciseness, precision, and ease of understanding. Avoid jargon where simpler terms suffice.
4.  **Improved Sample Answer**: Provide a concise, well-structured, relevant, and clear sample answer that demonstrates how the candidate could have answered the question more effectively.`,
});

const instantTextualAnswerFeedbackFlow = ai.defineFlow(
  {
    name: 'instantTextualAnswerFeedbackFlow',
    inputSchema: InstantTextualAnswerFeedbackInputSchema,
    outputSchema: InstantTextualAnswerFeedbackOutputSchema,
  },
  async (input) => {
    const {output} = await instantTextualAnswerFeedbackPrompt(input);
    return output!;
  }
);
