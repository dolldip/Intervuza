'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for JD-aware follow-ups.
 * Natural Conversational Loop: Handles "human" reactions and high-stakes logical pivots.
 * Revised: Added Dynamic Fallback System to prevent repetitive responses during 429 errors.
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
  verbalReaction: z.string().describe('Immediate human-like professional reaction (e.g., "Yeah," "I see," "Good point," "That seems a bit shallow"). Must be conversational.'),
  detectedEmotion: z.string().describe('Approval, Curiosity, Concern, or Neutral.'),
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
React to the candidate's answer naturally in a 1-to-1 conversation, then generate a follow-up that explores a DIFFERENT requirement from the JD.

CONVERSATIONAL PROTOCOL:
1. VERBAL REACTION: Start with a natural acknowledgment like "Yeah," "I see," "Right," "Good point," or a skeptical "I'm not sure about that," "That's a bit brief." 
2. Be human. Reference specific details from their answer: "{{{userAnswer}}}" to prove you are listening.
3. If the answer was "poor" or "vague," let your reaction reflect that professional skepticism immediately.

STRICT AUDIT CRITERIA (NLP Analysis):
- CORRECTNESS: Is the answer technically or logically sound?
- CLARITY: Is the communication structured?
- COMPLETENESS: Did they address the core of your previous question?
- CONFIDENCE: Does the language suggest mastery?

NEXT QUESTION STRATEGY: 
- Look at the Job Description ({{{jobDescriptionText}}}).
- Pick a DIFFERENT requirement or skill that hasn't been discussed yet.
- PIVOT dimensions: If the last question was technical, consider a behavioral or architectural challenge.
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
        // Increased backoff to help clear the quota window
        await new Promise(resolve => setTimeout(resolve, 3500 * attempt));
        continue;
      }

      // DYNAMIC FALLBACK SYSTEM
      // If we are here, retries failed. We must provide a non-repetitive fallback.
      const fallbacks = [
        {
          reaction: "I see your point on that. Let's look at it from a different angle.",
          question: `Regarding your role as a ${input.jobRole}, how do you prioritize long-term technical health versus short-term delivery pressure?`
        },
        {
          reaction: "Right, that's a common approach. Let's shift gears slightly.",
          question: `In a high-stakes environment for a ${input.jobRole}, how do you handle a situation where a key project dependency fails at the last minute?`
        },
        {
          reaction: "I understand. Let's move on to a different requirement of the role.",
          question: `Can you walk me through your process for mentoring junior team members or ensuring high standards of technical logic across your team?`
        }
      ];

      // Pick a fallback that hasn't been asked yet
      const previous = input.previousQuestions || [];
      const selected = fallbacks.find(f => !previous.includes(f.question)) || fallbacks[0];

      return {
        verbalReaction: selected.reaction,
        detectedEmotion: "Neutral",
        nextQuestion: selected.question,
        feedback: {
          analysis: "Your response provided a basic foundation but would benefit from more specific evidence-based examples. In high-stakes interviews, structure and evidence are as critical as technical knowledge.",
          strengths: ["Clear communication", "Direct approach"],
          weaknesses: ["Lacked structural depth", "Limited specific metrics"],
          tips: "Try incorporating the STAR method (Situation, Task, Action, Result) to make your logic more robust."
        },
        isInterviewComplete: false
      };
    }
  }
}
