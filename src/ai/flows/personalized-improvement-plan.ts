'use server';
/**
 * @fileOverview A Genkit flow for generating a personalized improvement plan based on interview performance.
 *
 * - generatePersonalizedImprovementPlan - A function that generates a personalized improvement plan.
 * - PersonalizedImprovementPlanInput - The input type for the generatePersonalizedImprovementPlan function.
 * - PersonalizedImprovementPlanOutput - The return type for the generatePersonalizedImprovementPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedImprovementPlanInputSchema = z.object({
  jobRole: z.string().describe("The job role the user is preparing for (e.g., 'Software Engineer')."),
  experienceLevel: z.string().describe("The user's experience level (e.g., 'Junior', 'Mid-level', 'Senior')."),
  userSkills: z.array(z.string()).describe("A list of skills the user possesses."),
  resumeSummary: z
    .string()
    .describe('A summary of the user\'s resume, highlighting key experiences and skills.'),
  jobDescription:
    z.string().optional().describe('The job description for which the user is preparing, if provided.'),
  overallInterviewReport:
    z.string()
      .describe(
        'A comprehensive report summarizing the user\'s overall interview performance, including scores, body language analysis, emotion detection, and general strengths and weaknesses.'
      ),
  detailedQuestionFeedback: z
    .array(z.string())
    .describe(
      'A list of detailed feedback points for individual questions asked during the interview, including observed weaknesses and suggested improvements.'
    ),
});
export type PersonalizedImprovementPlanInput = z.infer<
  typeof PersonalizedImprovementPlanInputSchema
>;

const PersonalizedImprovementPlanOutputSchema = z.object({
  planSummary: z.string().describe('A concise summary of the personalized improvement plan.'),
  targetedPracticeAreas:
    z.array(z.string())
      .describe(
        'Specific areas that require improvement and focused practice, based on interview performance.'
      ),
  practiceDrills: z
    .array(
      z.object({
        area: z.string().describe('The specific practice area this drill targets.'),
        description: z.string().describe('A detailed description of the drill to perform.'),
        example: z.string().optional().describe('An optional example or scenario for the drill.'),
      })
    )
    .describe('A list of practical drills and exercises to strengthen weak areas.'),
  confidenceBuildingExercises: z
    .array(
      z.object({
        name: z.string().describe('The name of the confidence-building exercise.'),
        description:
          z.string()
            .describe('Instructions or description for the confidence-building exercise.'),
      })
    )
    .describe('Exercises designed to boost confidence and reduce nervousness.'),
  dailyPracticeSuggestions:
    z.array(z.string()).describe('Short, actionable suggestions for daily practice routines.'),
});
export type PersonalizedImprovementPlanOutput = z.infer<
  typeof PersonalizedImprovementPlanOutputSchema
>;

export async function generatePersonalizedImprovementPlan(
  input: PersonalizedImprovementPlanInput
): Promise<PersonalizedImprovementPlanOutput> {
  return personalizedImprovementPlanFlow(input);
}

const personalizedImprovementPlanPrompt = ai.definePrompt({
  name: 'personalizedImprovementPlanPrompt',
  input: {schema: PersonalizedImprovementPlanInputSchema},
  output: {schema: PersonalizedImprovementPlanOutputSchema},
  prompt: `You are an AI Interview Coach dedicated to helping job seekers improve their interview performance.
Your goal is to generate a highly personalized and actionable improvement plan based on the user's recent mock interview performance.
The plan should focus on addressing weaknesses, leveraging strengths, and building overall confidence for the specific job role they are targeting.

Here is the user's profile and interview context:
Job Role: {{{jobRole}}}
Experience Level: {{{experienceLevel}}}
Skills: {{#each userSkills}}- {{{this}}}
{{/each}}
Resume Summary: {{{resumeSummary}}}
{{#if jobDescription}}
Job Description: {{{jobDescription}}}
{{/if}}

Overall Interview Performance Report:
{{{overallInterviewReport}}}

Detailed Feedback per Question:
{{#each detailedQuestionFeedback}}- {{{this}}}
{{/each}}

Based on the information above, create a comprehensive personalized improvement plan.
The plan should be structured as follows:

1.  **Summary of Plan**: A brief overview of the key focus areas.
2.  **Targeted Practice Areas**: List specific areas (e.g., "Technical concepts: Data Structures and Algorithms", "Behavioral questions: STAR method application", "Communication: Clarity and conciseness", "Confidence: Eye contact and body language") that need focused improvement.
3.  **Practice Drills**: For each targeted area, suggest concrete, actionable drills. Provide clear descriptions and, where helpful, an example scenario.
4.  **Confidence-Building Exercises**: Suggest general exercises to help boost overall confidence and reduce interview anxiety.
5.  **Daily Practice Suggestions**: Offer short, easy-to-follow tips for daily incorporation into their routine.

Ensure all suggestions are highly relevant to the identified weaknesses and the target job role. The plan should be encouraging and practical.`,
});

const personalizedImprovementPlanFlow = ai.defineFlow(
  {
    name: 'personalizedImprovementPlanFlow',
    inputSchema: PersonalizedImprovementPlanInputSchema,
    outputSchema: PersonalizedImprovementPlanOutputSchema,
  },
  async (input) => {
    const {output} = await personalizedImprovementPlanPrompt(input);
    return output!;
  }
);
