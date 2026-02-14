
'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for industry-aware follow-ups and real-time feedback.
 * Updated: IRONCLAD ZERO REPETITION CORE + DIMENSIONAL PIVOTING.
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
  verbalReaction: z.string().describe('Immediate human-like professional reaction to the SPECIFIC answer content.'),
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
The candidate just answered: "{{{userAnswer}}}" 
To your previous question: "{{{interviewQuestion}}}"

STRICT INTERVIEWER PROTOCOL (IRONCLAD):

1. HEAR THE ANSWER: Your "verbalReaction" MUST reference specific details from the candidate's answer. Do not say "Good answer." Say "I appreciate how you prioritized [Detail] in that scenario."

2. ZERO REPETITION (DIMENSIONAL PIVOTING):
   - You MUST NOT ask anything similar to these previous turns: {{#each previousQuestions}} - "{{{this}}}" {{/each}}
   - If the previous turn was about "Skills", this turn MUST be about "Ethics", "Future Trends", or "Hypothetical Conflict".
   - LOGIC LOCK: If your intended question even slightly overlaps with any previous question, you MUST discard it and pivot to a completely new dimension of the role.

3. EXPERIENCE LEVEL ADAPTATION (0-EXP SUPPORT):
   - If experienceLevel is "junior" or 0-2 years: 
     - FORBIDDEN: Do NOT ask about "leading teams", "past workplace conflicts", or "hiring".
     - REQUIRED: Ask about Academic Theory, "What-If" Industry scenarios, Logic Hurdles, or Learning Agility.
   - For Mid/Senior: Focus on Architecture, Strategic Trade-offs, and high-stakes Risk Management.

4. SECTOR SPECIFICITY:
   - Teachers: Focus on Pedagogy, Inclusive Design, Student Crisis, or Subject Depth.
   - Doctors: Focus on Clinical Logic, Ethical Dilemmas, or Diagnostic Pressure.
   - Engineers: Focus on System Architecture, Edge Cases, or Logic trade-offs.
   - HR: Focus on Policy, Conflict Mediation, or Talent Lifecycle.

5. VOICE: Be empathetic but strictly professional. Use contractions.

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
        "How do you approach designing a lesson plan for a classroom with highly varied learning speeds?",
        "Tell me about your philosophy on using positive reinforcement versus disciplinary measures.",
        "How do you handle a situation where a parent strongly disagrees with your assessment of their child?",
        "In your view, what is the most critical factor in maintaining student engagement during remote learning?"
      ],
      'Doctor': [
        "How do you maintain clinical objectivity when treating a patient with a complex emotional background?",
        "Walk me through your systematic approach to a patient presenting with vague, non-specific symptoms.",
        "What is your protocol for staying updated with the latest research in your specific medical specialty?",
        "How do you approach the ethical challenge of resource allocation in a high-pressure clinical environment?"
      ],
      'BTech Technical': [
        "If you were optimizing a system for 100x traffic, which component would you re-architect first and why?",
        "What are the most significant security implications of using a third-party API in a core production service?",
        "How do you ensure data consistency across multiple microservices in a distributed environment?",
        "Walk me through a time you had to choose between a 'perfect' technical solution and a 'fast' one."
      ],
      'default': [
        "Given the current shifts in your industry, what is one standard practice you believe will be obsolete in 5 years?",
        "How do you balance short-term deliverables with the long-term strategic health of your projects?",
        "What is one area of your professional knowledge where you feel you've made the most growth recently?",
        "How do you handle ambiguity when project requirements change midway through execution?"
      ]
    };
    
    const roleFallbacks = fallbacks[roleKey] || fallbacks['default'];
    const freshFallback = roleFallbacks.find(f => !input.previousQuestions?.includes(f)) || roleFallbacks[Math.floor(Math.random() * roleFallbacks.length)];

    return {
      verbalReaction: "I see your perspective on that. Let's explore a different dimension of your background.",
      detectedEmotion: "Neutral",
      nextQuestion: freshFallback,
      feedback: {
        strengths: ["Direct communication"],
        weaknesses: ["Could use more specific metrics"],
        tips: "Try to link your answer to a broader industry trend next time."
      },
      isInterviewComplete: false
    };
  }
}
