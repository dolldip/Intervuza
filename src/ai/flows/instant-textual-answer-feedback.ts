'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for JD-aware follow-ups.
 * Natural Conversational Loop: Handles "human" reactions and high-stakes logical pivots.
 * Enhanced: Now includes "Integrity Detection" for honest admissions.
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
  verbalReaction: z.string().describe('Immediate human-like professional reaction (e.g., "Yeah," "I see," "I appreciate your honesty on that," "That seems a bit shallow"). Must be conversational.'),
  detectedEmotion: z.string().describe('Approval, Curiosity, Concern, Empathy, or Neutral.'),
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
  prompt: `You are Aria, an elite human-like AI interviewer for the position of {{{jobRole}}}. 

CORE OBJECTIVE:
React to the candidate's answer naturally. You must distinguish between a technical answer, a behavioral story, and an admission of ignorance (e.g., "I don't know", "idk", "not sure").

HUMAN REACTION PROTOCOLS:
1. HONESTY PROTOCOL: If the user admits they don't know something, react with professional empathy. Example: "I appreciate your honesty. In a high-stakes role, knowing your limits is better than guessing. Let's shift gears to another area of your expertise."
2. TECHNICAL PROTOCOL: If they give a technical answer, acknowledge its depth or lack thereof.
3. CONVERSATIONAL SYNC: Use phrases like "Yeah," "I see," "Right," "Interesting point," or "I'm not sure that quite hits the mark."

STRICT AUDIT CRITERIA (NLP Analysis):
- CORRECTNESS: Is the answer technically or logically sound?
- CLARITY: Is the communication structured?
- COMPLETENESS: Did they address the core?
- CONFIDENCE: If they said "I don't know" confidently and honestly, mark that as a strength in "Professional Integrity".

NEXT QUESTION STRATEGY: 
- If they didn't know the last topic, pivot to a COMPLETELY DIFFERENT requirement from the JD ({{{jobDescriptionText}}}).
- AVOID these previous questions: {{#each previousQuestions}} - "{{{this}}}" {{/each}}

Candidate Answer: "{{{userAnswer}}}" 
To your previous question: "{{{interviewQuestion}}}"

Random Seed: ${new Date().getTime()}`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const {output} = await prompt(input);
      if (!output) throw new Error("Aria failed to respond.");
      return output;
    } catch (error: any) {
      const isRateLimit = error?.status === 'RESOURCE_EXHAUSTED' || error?.code === 429;
      if (isRateLimit && attempt < maxRetries) {
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 4000 * attempt));
        continue;
      }

      // DYNAMIC FREE FALLBACK SYSTEM
      const fallbacks = [
        {
          reaction: "I appreciate your perspective on that. Let's look at a different aspect of the role.",
          question: `Regarding your role as a ${input.jobRole}, how do you approach learning new complex systems under tight deadlines?`
        },
        {
          reaction: "I see. Let's move on to a different technical requirement.",
          question: `In a high-stakes environment for a ${input.jobRole}, how do you handle conflict within your technical team?`
        },
        {
          reaction: "Thanks for being direct. Let's pivot to your experience with project lifecycles.",
          question: `Can you walk me through a time you had to pivot a strategy based on new data or feedback?`
        },
        {
          reaction: "Right. That's a common approach. Let's dig into something else.",
          question: `How do you measure success in this ${input.jobRole} role beyond just meeting deadlines?`
        }
      ];

      const previous = input.previousQuestions || [];
      const selected = fallbacks.find(f => !previous.includes(f.question)) || fallbacks[0];

      return {
        verbalReaction: selected.reaction,
        detectedEmotion: "Neutral",
        nextQuestion: selected.question,
        feedback: {
          analysis: "Your response provides a foundation, but we are looking for more evidence-based logic. Professionalism includes both what you know and how you communicate what you don't.",
          strengths: ["Directness", "Professional tone"],
          weaknesses: ["Structural depth"],
          tips: "When unsure, explain how you would find the answer. This shows technical resourcefulness."
        },
        isInterviewComplete: false
      };
    }
  }
}
