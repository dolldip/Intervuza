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
  })).optional().describe('Optional detailed feedback for each question, including strengths, weaknesses, and improved answers.')
});
export type ComprehensiveInterviewFeedbackReportInput = z.infer<typeof ComprehensiveInterviewFeedbackReportInputSchema>;

const ComprehensiveInterviewFeedbackReportOutputSchema = z.object({
  overallScore: z.number().describe('An overall performance score for the entire interview (0-100).'),
  confidenceScore: z.number().describe('An overall confidence score for the entire interview (0-100).'),
  communicationScore: z.number().describe('An overall communication effectiveness score (0-100).'),
  technicalRoleFitScore: z.number().describe('An overall score reflecting how well the answers demonstrate technical and role-specific fit (0-100).'),
  strengths: z.array(z.string()).describe('A list of general strengths identified across the entire interview performance.'),
  weaknesses: z.array(z.string()).describe('A list of general weaknesses identified across the entire interview performance, highlighting areas for improvement.'),
  improvementPlan: z.string().describe('A detailed, actionable, and personalized plan for improving interview skills, focusing on identified weaknesses.'),
  bodyLanguageReport: z.string().describe('A comprehensive qualitative report on observed body language, eye contact, facial expressions, and overall emotional presentation.'),
  sampleAnswerImprovements: z.array(z.object({
    question: z.string().describe('The original question asked.'),
    originalAnswerSummary: z.string().describe('A summary of the user\'s original answer to this question.'),
    improvedAnswer: z.string().describe('A suggested improved sample answer for this question, based on best practices.'),
    feedback: z.string().describe('Specific feedback explaining why the improved answer is better and what to focus on.'),
  })).describe('A selection of key questions with original answers, suggested improvements, and specific feedback.')
});
export type ComprehensiveInterviewFeedbackReportOutput = z.infer<typeof ComprehensiveInterviewFeedbackReportOutputSchema>;

export async function comprehensiveInterviewFeedbackReport(input: ComprehensiveInterviewFeedbackReportInput): Promise<ComprehensiveInterviewFeedbackReportOutput> {
  return comprehensiveInterviewFeedbackReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'comprehensiveInterviewFeedbackReportPrompt',
  input: {schema: ComprehensiveInterviewFeedbackReportInputSchema},
  output: {schema: ComprehensiveInterviewFeedbackReportOutputSchema},
  prompt: `You are an expert AI Interview Coach. Your task is to provide a comprehensive and actionable feedback report for a job seeker who has just completed a mock interview.\n\nThe user is preparing for the {{{jobRole}}} role at an {{{experienceLevel}}} experience level.\n\nAnalyze the provided summaries of the interview performance across various dimensions (text, voice, camera, and overall confidence consistency) and per-question feedback if available.\nSynthesize all this information into a structured report focusing on overall scores, strengths, weaknesses, a detailed improvement plan, and specific examples of how to improve answers.\n\n--- Interview Performance Data ---\nJob Role: {{{jobRole}}}\nExperience Level: {{{experienceLevel}}}\nOverall Interview Context/Summary:\n{{{interviewSummary}}}\n\nText Analysis Feedback:\n{{{overallTextAnalysisFeedback}}}\n\nVoice Analysis Feedback:\n{{{overallVoiceAnalysisFeedback}}}\n\nCamera/Body Language Analysis Feedback:\n{{{overallCameraAnalysisFeedback}}}\n\nConfidence Consistency Score: {{{confidenceConsistencyScore}}} (Out of 100)\n\n{{#if perQuestionFeedback}}\nDetailed Per-Question Feedback:\n{{#each perQuestionFeedback}}\n  Question: \"{{{question}}}\"\n  Your Answer: \"{{{originalAnswerSummary}}}\"\n  Strengths: {{#each strengths}}- {{{this}}}\n  {{/each}}\n  Weaknesses: {{#each weaknesses}}- {{{this}}}\n  {{/each}}\n  Improved Sample Answer: \"{{{improvedSampleAnswer}}}\"\n\n{{/each}}\n{{/if}}\n--- End of Interview Performance Data ---\n\nBased on the data above, generate a comprehensive feedback report.\nThe report MUST include:\n1.  **Overall Performance Scores**: Provide an overall score, confidence score, communication score, and technical/role-fit score, each out of 100.\n2.  **General Strengths**: A list of 3-5 overall strengths observed during the interview.\n3.  **General Weaknesses**: A list of 3-5 overall weaknesses observed during the interview.\n4.  **Personalized Improvement Plan**: A detailed, actionable improvement plan with specific steps the user can take to address their weaknesses and enhance their overall interview performance for the {{{jobRole}}} role.\n5.  **Body Language & Emotion Report**: A qualitative summary of the user's body language, eye contact, facial expressions, and detected emotions, including specific observations and suggestions.\n6.  **Key Sample Answer Improvements**: Select 2-3 significant questions where improvements can be made. For each, provide the original question, a summary of the user's answer, a significantly improved sample answer, and clear feedback on *why* the improved answer is better and what key aspects the user should focus on. If `perQuestionFeedback` is provided, use it to inform this section.\n\nEnsure the tone is constructive, encouraging, and highly professional. Aim for a detailed and insightful report.`
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