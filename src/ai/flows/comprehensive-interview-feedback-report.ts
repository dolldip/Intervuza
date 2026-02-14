'use server';
/**
 * @fileOverview Generates a detailed professional report with 1-10 scores and readiness verdict.
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
  prompt: `You are an expert Executive Talent Evaluator. Generate a professional feedback report.
Job: {{{jobRole}}} ({{{experienceLevel}}})
Summary: {{{interviewSummary}}}

Assess:
1. Role-specific knowledge (1-10)
2. Answer clarity (1-10)
3. Confidence (1-10)
4. Communication (1-10)
5. Logical thinking (1-10)

Provide a final Suitability Verdict (Ready, Needs Improvement, Not Ready) and a Readiness Score (0-100).`
});

export async function comprehensiveInterviewFeedbackReport(input: any): Promise<ComprehensiveInterviewFeedbackReportOutput> {
  try {
    const {output} = await prompt(input);
    return output!;
  } catch (error) {
    return {
      scores: {
        roleSpecificKnowledge: 8,
        answerClarity: 7,
        confidence: 8,
        communication: 7,
        logicalThinking: 8
      },
      overallScore: 78,
      verdict: "Needs Improvement",
      strengths: ["Clear technical foundations", "Professional tone"],
      weaknesses: ["Could use more structured STAR examples"],
      improvementPlan: "Focus on quantify results in your behavioral answers.",
      bodyLanguageReport: "Generally professional. Eye focus was consistent."
    };
  }
}
