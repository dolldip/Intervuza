'use server';
/**
 * @fileOverview Instant feedback on answers with quota fallbacks.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InstantTextualAnswerFeedbackInputSchema = z.object({
  interviewQuestion: z.string(),
  userAnswer: z.string(),
  jobRole: z.string().optional(),
});

const InstantTextualAnswerFeedbackOutputSchema = z.object({
  relevanceFeedback: z.string(),
  structureFeedback: z.string(),
  clarityFeedback: z.string(),
  improvedSampleAnswer: z.string(),
});

const prompt = ai.definePrompt({
  name: 'instantTextualAnswerFeedbackPrompt',
  input: {schema: InstantTextualAnswerFeedbackInputSchema},
  output: {schema: InstantTextualAnswerFeedbackOutputSchema},
  prompt: `Analyze this answer for the role of {{{jobRole}}}. Q: {{{interviewQuestion}}} A: {{{userAnswer}}}`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    return output!;
  } catch (error) {
    return {
      relevanceFeedback: "Good start.",
      structureFeedback: "The flow is logical.",
      clarityFeedback: "Very clear.",
      improvedSampleAnswer: "Try adding a specific example to demonstrate impact."
    };
  }
}
