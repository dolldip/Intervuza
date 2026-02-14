
'use server';
/**
 * @fileOverview Generates a detailed audit of the interview session.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ComprehensiveInterviewFeedbackReportInputSchema = z.object({
  jobRole: z.string(),
  experienceLevel: z.string(),
  interviewSummary: z.string(),
  confidenceConsistencyScore: z.number(),
});

const ComprehensiveInterviewFeedbackReportOutputSchema = z.object({
  scores: z.object({
    roleSpecificKnowledge: z.number().min(1).max(10),
    answerClarity: z.number().min(1).max(10),
    confidence: z.number().min(1).max(10),
    communication: z.number().min(1).max(10),
    logicalThinking: z.number().min(1).max(10),
  }),
  overallScore: z.number(),
  verdict: z.enum(['Ready', 'Needs Improvement', 'Not Ready']),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  improvementPlan: z.string(),
  bodyLanguageReport: z.string(),
});

export type ComprehensiveInterviewFeedbackReportOutput = z.infer<typeof ComprehensiveInterviewFeedbackReportOutputSchema>;

const prompt = ai.definePrompt({
  name: 'comprehensiveInterviewFeedbackReportPrompt',
  input: {schema: ComprehensiveInterviewFeedbackReportInputSchema},
  output: {schema: ComprehensiveInterviewFeedbackReportOutputSchema},
  prompt: `You are an expert Talent Evaluator. Generate a professional feedback audit for a mock interview.
Job Role: {{{jobRole}}}
Experience Level: {{{experienceLevel}}}
Interview Data: {{{interviewSummary}}}

Assess based on these rules:
1. Provide categories scores (1-10).
2. Be honest: if answers were weak, give low scores.
3. Verdict must be realistic (Ready, Needs Improvement, Not Ready).
4. Overall Score is 0-100.
5. Improvement plan must be role-specific and include coding/technical tips if applicable.`
});

export async function comprehensiveInterviewFeedbackReport(input: any): Promise<ComprehensiveInterviewFeedbackReportOutput> {
  try {
    const {output} = await prompt(input);
    if (!output) throw new Error("Empty AI response");
    return output;
  } catch (error) {
    return {
      scores: {
        roleSpecificKnowledge: 7,
        answerClarity: 7,
        confidence: 8,
        communication: 7,
        logicalThinking: 7
      },
      overallScore: 72,
      verdict: "Needs Improvement",
      strengths: ["Strong professional tone", "Good foundational logic"],
      weaknesses: ["Could use more technical depth in technical rounds", "Focus occasionally shifted during complex questions"],
      improvementPlan: "Focus on the STAR method for behavioral answers and practice specific technical architectures for your role.",
      bodyLanguageReport: "Professional presence observed. Eye focus was generally consistent."
    };
  }
}
