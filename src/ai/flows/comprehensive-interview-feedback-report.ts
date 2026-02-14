'use server';
/**
 * @fileOverview A Genkit flow for generating a comprehensive interview feedback report.
 *
 * - comprehensiveInterviewFeedbackReport - A function that generates a comprehensive feedback report after a full mock interview.
 * - ComprehensiveInterviewFeedbackReportInput - The input type for the comprehensiveInterviewFeedbackReport function.
 * - ComprehensiveInterviewFeedbackReportOutput - The return type for the comprehensiveInterviewFeedbackReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ComprehensiveInterviewFeedbackReportInputSchema = z.object({
  jobRole: z.string().describe('The job role the user is preparing for.'),
  experienceLevel: z.string().describe('The user\'s experience level for the job role.'),
  interviewSummary: z.string().describe('A summarized transcript or overview of the entire mock interview, including questions asked and user\'s responses.'),
  overallTextAnalysisFeedback: z.string().describe('A summary of text-based analysis, covering relevance, structure, and clarity of answers across the interview.'),
  overallVoiceAnalysisFeedback: z.string().describe('A summary of voice-based analysis, covering tone, speed, confidence, and filler words used across the interview.'),
  overallCameraAnalysisFeedback: z.string().describe('A summary of camera-based analysis, covering eye contact, facial expressions, body language, nervousness, and overall emotional presentation across the interview.'),
  confidenceConsistencyScore: z.number().describe('A numerical score representing the consistency of confidence detected throughout the interview (0-100).'),
  perQuestionFeedback: z.array(z.object({
    question: z.string().describe('The question asked.'),
    originalAnswerSummary: z.string().describe('A summary of the user\'s original answer.'),
    strengths: z.array(z.string()).describe('Strengths identified for this specific answer.'),
    weaknesses: z.array(z.string()).describe('Weaknesses identified for this specific answer.'),
    improvedSampleAnswer: z.string().describe('A suggested improved sample answer for this question.'),
  })).optional().describe('Optional detailed feedback for each question.')
});
export type ComprehensiveInterviewFeedbackReportInput = z.infer<typeof ComprehensiveInterviewFeedbackReportInputSchema>;

const ComprehensiveInterviewFeedbackReportOutputSchema = z.object({
  overallScore: z.number().describe('An overall performance score for the entire interview (0-100).'),
  confidenceScore: z.number().describe('An overall confidence score for the entire interview (0-100).'),
  communicationScore: z.number().describe('An overall communication effectiveness score (0-100).'),
  technicalRoleFitScore: z.number().describe('An overall score reflecting how well the answers demonstrate technical and role-specific fit (0-100).'),
  strengths: z.array(z.string()).describe('A list of general strengths identified.'),
  weaknesses: z.array(z.string()).describe('A list of general weaknesses identified.'),
  improvementPlan: z.string().describe('A detailed, actionable, and personalized plan for improving interview skills.'),
  bodyLanguageReport: z.string().describe('A comprehensive qualitative report on observed body language.'),
  sampleAnswerImprovements: z.array(z.object({
    question: z.string().describe('The original question asked.'),
    originalAnswerSummary: z.string().describe('A summary of the user\'s original answer.'),
    improvedAnswer: z.string().describe('A suggested improved sample answer.'),
    feedback: z.string().describe('Specific feedback explaining why the improved answer is better.'),
  })).describe('A selection of key questions with improvements.')
});
export type ComprehensiveInterviewFeedbackReportOutput = z.infer<typeof ComprehensiveInterviewFeedbackReportOutputSchema>;

export async function comprehensiveInterviewFeedbackReport(input: ComprehensiveInterviewFeedbackReportInput): Promise<ComprehensiveInterviewFeedbackReportOutput> {
  return comprehensiveInterviewFeedbackReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'comprehensiveInterviewFeedbackReportPrompt',
  input: {schema: ComprehensiveInterviewFeedbackReportInputSchema},
  output: {schema: ComprehensiveInterviewFeedbackReportOutputSchema},
  prompt: `You are an expert AI Interview Coach. Provide a comprehensive feedback report.

User Role: {{{jobRole}}} ({{{experienceLevel}}})

Data:
{{{interviewSummary}}}

Text Analysis: {{{overallTextAnalysisFeedback}}}
Voice Analysis: {{{overallVoiceAnalysisFeedback}}}
Camera Analysis: {{{overallCameraAnalysisFeedback}}}
Confidence Score: {{{confidenceConsistencyScore}}}

{{#if perQuestionFeedback}}
Per-Question Details:
{{#each perQuestionFeedback}}
- Q: "{{{question}}}"
  Answer: "{{{originalAnswerSummary}}}"
  Strengths: {{#each strengths}}{{{this}}}, {{/each}}
  Weaknesses: {{#each weaknesses}}{{{this}}}, {{/each}}
  Improved: "{{{improvedSampleAnswer}}}"
{{/each}}
{{/if}}

Generate the report with scores, strengths, weaknesses, a plan, and key improvements.`
});

const comprehensiveInterviewFeedbackReportFlow = ai.defineFlow(
  {
    name: 'comprehensiveInterviewFeedbackReportFlow',
    inputSchema: ComprehensiveInterviewFeedbackReportInputSchema,
    outputSchema: ComprehensiveInterviewFeedbackReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);