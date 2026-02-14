
'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for industry-aware follow-ups and real-time feedback.
 * Updated: STRICTUREST Zero-Repetition and Dimensional Pivoting logic.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InstantTextualAnswerFeedbackInputSchema = z.object({
  interviewQuestion: z.string(),
  userAnswer: z.string(),
  jobRole: z.string(),
  experienceLevel: z.string(),
  currentRound: z.enum(['technical', 'hr']),
  resumeText: z.string().optional(),
  previousQuestions: z.array(z.string()).optional(),
  isStuck: z.boolean().optional(),
});

const InstantTextualAnswerFeedbackOutputSchema = z.object({
  verbalReaction: z.string().describe('Immediate human-like professional reaction referencing specific details from the candidate answer.'),
  detectedEmotion: z.string().describe('Approval, Curiosity, Concern, or Neutral.'),
  nextQuestion: z.string().describe('The single next question. MUST BE COMPLETELY DIFFERENT TOPIC.'),
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
  prompt: `You are Aria, an elite AI interviewer for the position of {{{jobRole}}}. 
The candidate just answered: "{{{userAnswer}}}" 
To your previous question: "{{{interviewQuestion}}}"

YOUR TASK:
1. READ carefully.
2. ANALYZE the answer for:
   - Correctness: Is the technical or logical content accurate?
   - Clarity: Is the explanation easy to follow?
   - Completeness: Did they address all parts of the question?
   - Confidence: Does the tone and structure suggest mastery?
3. FEEDBACK: Provide a single, short constructive paragraph in the "analysis" field.
4. NEXT QUESTION: Generate a relevant follow-up or pivot to a new dimension based on the job profile and answer.

STRICT INTERVIEWER PROTOCOL (IRONCLAD):

1. HEAR THE ANSWER: Your "verbalReaction" MUST reference specific details from the candidate's answer. Use natural phrases like "I appreciate how you prioritized [Detail]..." or "That's an interesting approach to [Detail]..."

2. ZERO REPETITION (DIMENSIONAL PIVOTING):
   - You MUST NOT ask anything similar to these previous turns: {{#each previousQuestions}} - "{{{this}}}" {{/each}}
   - If the previous question was Technical, pivot to Leadership or Ethics.
   - If the previous question was Behavioral, pivot to a Logic Puzzle or Industry Trend.
   - Dimensions: [Ethics, Future Trends, Technical Architecture, Conflict, Leadership, Strategic Vision].

3. EXPERIENCE LEVEL ADAPTATION:
   - Level: {{{experienceLevel}}}. Adjust complexity accordingly.

4. SECTOR SPECIFICITY: Use sector-specific logic for {{{jobRole}}}.

Random Seed: ${new Date().getTime()}`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    if (!output) throw new Error("Aria failed to respond.");
    return output;
  } catch (error) {
    const roleKey = input.jobRole?.toLowerCase().includes('teacher') ? 'Teacher' : 
                    input.jobRole?.toLowerCase().includes('doctor') ? 'Doctor' : 
                    input.jobRole?.toLowerCase().includes('btech') || input.jobRole?.toLowerCase().includes('engineer') ? 'BTech Technical' : 'default';

    const fallbacks: Record<string, string[]> = {
      'Teacher': [
        "In your view, how should a curriculum adapt to ensure students with varied learning speeds aren't left behind?",
        "If a student consistently challenges your authority, what is your immediate pedagogical strategy?",
        "How do you incorporate emotional intelligence into your classroom management style?",
        "Describe your approach to parent-teacher collaboration in high-conflict situations."
      ],
      'Doctor': [
        "When faced with a diagnostic discrepancy, how do you systematically re-evaluate your hypothesis?",
        "How do you approach communicating terminal news with both empathy and clinical clarity?",
        "What is your protocol for managing clinical burnout while maintaining patient care standards?",
        "How do you stay updated with rapidly evolving medical research while maintaining a full clinical load?"
      ],
      'BTech Technical': [
        "If you had to optimize a system for a 100x traffic surge, which core component would you harden first?",
        "How do you ensure data integrity across multiple microservices in an eventually consistent environment?",
        "What is your approach to security in the software development lifecycle? Where does it start?",
        "Describe a time you had to argue for a specific technical choice against a stakeholder's preference. What was the outcome?"
      ],
      'default': [
        "Given the current shifts in your industry, what is one legacy standard you believe is becoming obsolete?",
        "How do you navigate ambiguity when project requirements shift midway through execution?",
        "What is your philosophy on leadership within a cross-functional team?",
        "How do you evaluate the success of a project beyond basic technical metrics?"
      ]
    };
    
    const roleFallbacks = fallbacks[roleKey] || fallbacks['default'];
    // Filter out already used questions
    const unusedFallbacks = roleFallbacks.filter(f => !input.previousQuestions?.includes(f));
    const freshFallback = unusedFallbacks.length > 0 ? unusedFallbacks[Math.floor(Math.random() * unusedFallbacks.length)] : roleFallbacks[0];

    return {
      verbalReaction: "I see your perspective. Let's explore another aspect of your expertise.",
      detectedEmotion: "Neutral",
      nextQuestion: freshFallback,
      feedback: {
        analysis: "Your response provided a basic starting point, but lacked the technical depth or structured clarity required for this seniority. Focusing on specific methodologies like the STAR method would improve your completeness and perceived confidence.",
        strengths: ["Direct response"],
        weaknesses: ["Lacked specific metrics", "Incomplete explanation"],
        tips: "Try to quantify your results and provide a structured framework in your next answer."
      },
      isInterviewComplete: false
    };
  }
}
