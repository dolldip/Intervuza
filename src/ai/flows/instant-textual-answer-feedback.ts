'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for JD-aware follow-ups.
 * Enhanced: Human-sync reactions and honesty detection.
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
  verbalReaction: z.string().describe('Immediate human-like professional reaction (e.g., "Yeah," "I see," "I appreciate your honesty").'),
  detectedEmotion: z.string(),
  nextQuestion: z.string().describe('The single next question. MUST BE COMPLETELY DIFFERENT TOPIC.'),
  feedback: z.object({
    analysis: z.string(),
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
React to the candidate's answer naturally. You must distinguish between a technical answer, a behavioral story, and an admission of ignorance (e.g., "I don't know", "idk").

HUMAN REACTION PROTOCOLS:
1. HONESTY PROTOCOL: If the user says "I don't know" or seems stuck, react with professional respect. Example: "I appreciate the honesty. In a high-stakes role, knowing your limits is better than guessing. Let's shift gears to another area."
2. REACTION FILLERS: Start your verbalReaction with conversational fillers like "Yeah," "Right," "I see," or "Interesting point."
3. CRITICAL AUDIT: If the answer is shallow or generic, your reaction should be professionally skeptical (e.g., "That's a bit surface-level; let's dig into a different challenge").

NEXT QUESTION STRATEGY: 
- Move to a COMPLETELY DIFFERENT requirement from the JD ({{{jobDescriptionText}}}).
- AVOID REPETITION: Do not ask about concepts in: {{#each previousQuestions}} - "{{{this}}}" {{/each}}

Candidate Answer: "{{{userAnswer}}}" 
To your question: "{{{interviewQuestion}}}"`
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

      const fallbacks = [
        {
          reaction: "Yeah, I appreciate your perspective on that. Let's look at another aspect of the role.",
          question: `Regarding your experience as a ${input.jobRole}, how do you approach learning complex new systems under tight deadlines?`
        },
        {
          reaction: "I see. Let's move on to a different technical requirement.",
          question: `In a high-stakes environment for a ${input.jobRole}, how do you handle internal team conflict regarding architectural decisions?`
        },
        {
          reaction: "Right. Thanks for being direct. Let's pivot to your experience with project lifecycles.",
          question: `Can you walk me through a time you had to pivot a strategy mid-project based on new data?`
        }
      ];

      const previous = input.previousQuestions || [];
      const selected = fallbacks.find(f => !previous.includes(f.question)) || fallbacks[0];

      return {
        verbalReaction: selected.reaction,
        detectedEmotion: "Neutral",
        nextQuestion: selected.question,
        feedback: {
          analysis: "Your response shows potential, but we are looking for more evidence-based logic. Professionalism includes structural clarity.",
          strengths: ["Directness"],
          weaknesses: ["Structural depth"],
          tips: "Practice the STAR method to give more concrete examples of your expertise."
        },
        isInterviewComplete: false
      };
    }
  }
}
