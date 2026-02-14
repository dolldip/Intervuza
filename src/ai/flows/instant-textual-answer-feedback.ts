
'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for industry-aware follow-ups and real-time feedback.
 * Updated: IRONCLAD ZERO REPETITION CORE + EXPERIENCE AWARENESS (0-Exp Support).
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
  verbalReaction: z.string().describe('Immediate human-like professional reaction.'),
  detectedEmotion: z.string().describe('Approval, Curiosity, Concern, or Neutral.'),
  nextQuestion: z.string().describe('The single next question. MUST BE COMPLETELY DIFFERENT TOPIC.'),
  feedback: z.object({
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
  prompt: `You are Aria, an elite professional interviewer. 
The candidate answered: "{{{userAnswer}}}" to your question: "{{{interviewQuestion}}}"

STRICT INTERVIEWER RULES (IRONCLAD):
1. ZERO REPETITION: 
   - Check the "previousQuestions" list: {{#each previousQuestions}} - "{{{this}}}" {{/each}}
   - If your intended next question is LOGICALLY SIMILAR or covers the SAME SUB-TOPIC as ANY of these, you MUST PIVOT to a completely different dimension of the candidate's role.
   - DO NOT repeat words or phrasing from previous questions. 
   - DO NOT ask about "critical feedback to a peer" if already asked or if it is conceptually similar to a leadership turn.

2. EXPERIENCE AWARENESS (0-EXP SUPPORT):
   - If experienceLevel is "junior" or 0-2 years: DO NOT ask about "leading teams," "hiring," or "delivering critical feedback to peers." 
   - Instead, ask about: Theoretical hurdles, academic projects, "What would you do" hypothetical scenarios, or subject-depth logic.
   - For mid/senior: Ask about high-stakes leadership, architecture trade-offs, and legacy management.

3. ROLE-SENSITIVE TECHNICALITY:
   - For Teachers: Focus on Pedagogy, Inclusion, Classroom Conflict, or Student engagement.
   - For Doctors: Focus on Diagnosis, Ethics, Case scenarios, or Patient relations.
   - For Engineers: Focus on Architecture, Performance, or System Design.
   - NEVER ask a Teacher about "Projects" unless they are in research.

4. CONVERSATIONAL PROGRESSION:
   - Acknowledge their answer naturally ("I see your point...", "Interesting perspective...").
   - The next question must be a SHARP PIVOT to ensure variety and depth.

5. VOICE: Use contractions. Be empathetic but strictly honest.

Random Seed: ${new Date().getTime()}`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    if (!output) throw new Error("Aria failed to respond.");
    return output;
  } catch (error) {
    // DYNAMIC ROLE-AWARE FALLBACKS
    const fallbacks: Record<string, string[]> = {
      'Teacher': [
        "How do you handle a student who is consistently disengaged despite various teaching strategies?",
        "What's your philosophy on using technology in the classroom without it becoming a distraction?",
        "Tell me about a time you had to adapt your lesson plan on the fly because students weren't grasping the concept."
      ],
      'Doctor': [
        "In a high-pressure diagnostic scenario, how do you prioritize patient safety over speed?",
        "How do you handle a situation where a patient's family disagrees with your proposed treatment plan?",
        "What steps do you take to stay current with the rapidly evolving medical literature?"
      ],
      'BTech Technical': [
        "Can you explain the trade-offs between vertical and horizontal scaling in a distributed system?",
        "How do you ensure data integrity in a system with high concurrency?",
        "Walk me through your process for debugging a complex performance bottleneck in production."
      ],
      'default': [
        "Given the current shifts in your industry, what's one legacy practice you think we should abandon?",
        "How do you balance the need for immediate results with the long-term sustainability of your work?",
        "What's one area of your professional toolkit you're currently trying to improve?"
      ]
    };

    const roleKey = input.jobRole?.includes('Teacher') ? 'Teacher' : 
                    input.jobRole?.includes('Doctor') ? 'Doctor' : 
                    input.jobRole?.includes('BTech') ? 'BTech Technical' : 'default';
    
    const roleFallbacks = fallbacks[roleKey] || fallbacks['default'];
    // Filter out previous questions
    const freshFallback = roleFallbacks.find(f => !input.previousQuestions?.includes(f)) || roleFallbacks[Math.floor(Math.random() * roleFallbacks.length)];

    return {
      verbalReaction: "I see. Let's move to a different aspect of your background.",
      detectedEmotion: "Neutral",
      nextQuestion: freshFallback,
      feedback: {
        strengths: ["Direct response"],
        weaknesses: ["Needs more specific detail"],
        tips: "Try to include a metric or a specific outcome next time."
      },
      isInterviewComplete: false
    };
  }
}
