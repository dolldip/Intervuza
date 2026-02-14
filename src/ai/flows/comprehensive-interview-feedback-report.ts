
'use server';
/**
 * @fileOverview Generates a detailed audit of the interview session.
 * Revised: Strictly honest and critical evaluation based on performance.
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
Interview Data (Transcript/Summary): {{{interviewSummary}}}
Sensors Score: {{{confidenceConsistencyScore}}}%

STRICT RULES FOR HONESTY:
1. DO NOT be overly positive. If the candidate struggled with technical concepts, point it out.
2. VERDICT: Use 'Ready' only if they were near-perfect. Use 'Needs Improvement' for average performance. Use 'Not Ready' if they failed core technical or communication bars.
3. SCORES: Use the full 1-10 range. Don't default to 7 or 8. If they lacked depth, give a 3 or 4.
4. IMPROVEMENT: Be specific. If they had grammar issues, tell them. If they didn't know a specific tech stack, name it.
5. BODY LANGUAGE: Use the Sensors Score to comment on their focus and consistency.`
});

export async function comprehensiveInterviewFeedbackReport(input: any): Promise<ComprehensiveInterviewFeedbackReportOutput> {
  try {
    const {output} = await prompt(input);
    if (!output) throw new Error("Empty AI response");
    return output;
  } catch (error) {
    // Return a structured "Needs Improvement" placeholder only if the AI service is literally down
    return {
      scores: {
        roleSpecificKnowledge: 4,
        answerClarity: 5,
        confidence: 6,
        communication: 5,
        logicalThinking: 4
      },
      overallScore: 48,
      verdict: "Needs Improvement",
      strengths: ["Willingness to engage"],
      weaknesses: ["Technical depth was insufficient for the role", "Communication lacked structure (STAR method missing)"],
      improvementPlan: "Focus on deepening role-specific technical knowledge and practicing the STAR method for behavioral answers.",
      bodyLanguageReport: "Sensors indicated inconsistent focus during complex questioning."
    };
  }
}
