'use server';
/**
 * @fileOverview Aria's adaptive intelligence engine for industry-aware follow-ups and real-time feedback.
 * Updated: IRONCLAD ZERO REPETITION CORE + DIMENSIONAL PIVOTING.
 * Added: Deep Empathy Protocol - Reference specific answer details.
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

1. HEAR THE ANSWER: Your "verbalReaction" MUST reference specific details from the candidate's answer. Do not say "Good answer." or "I see." Use natural phrases like "I appreciate how you prioritized [Detail] in that scenario" or "That's an interesting approach to [Detail], it shows a focus on [Logic]."

2. ZERO REPETITION (DIMENSIONAL PIVOTING):
   - You MUST NOT ask anything similar to these previous turns: {{#each previousQuestions}} - "{{{this}}}" {{/each}}
   - If the previous turn was about "Skills", this turn MUST be about "Ethics", "Future Trends", or "Hypothetical Conflict".
   - LOGIC LOCK: If your intended question even slightly overlaps with any previous question, you MUST discard it and pivot to a completely new dimension of the role.

3. EXPERIENCE LEVEL ADAPTATION (0-EXP SUPPORT):
   - If experienceLevel is "junior" or 0-2 years: 
     - FORBIDDEN: Do NOT ask about "leading teams", "past workplace conflicts", "hiring", or "critical feedback to peers".
     - REQUIRED: Ask about Academic Theory, "What-If" Industry scenarios, Logic Hurdles, or Learning Agility. Focus on potential, not history.

4. SECTOR SPECIFICITY:
   - Teachers: Dimensions: [Subject Pedagogy, Classroom Conflict, Inclusive Design, Student Crisis, Subject Depth]. NO "PROJECTS".
   - Doctors: Dimensions: [Clinical Logic, Ethical Dilemmas, Patient Empathy, Diagnostic Pressure, Research Trends].
   - Engineers: Dimensions: [System Architecture, Edge Cases, Security Trade-offs, Logic Hurdles].
   - HR: Dimensions: [Policy Logic, Conflict Mediation, Talent Lifecycle, Legal Compliance].

5. VOICE: Be empathetic but strictly professional. Use contractions. Act like a human who is listening and thinking.

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
        "If a student consistently challenges your authority in front of the class, what is your immediate pedagogical strategy?",
        "How do you maintain subject depth while ensuring complex topics remain accessible to younger learners?",
        "Walk me through your philosophy on using positive reinforcement versus traditional disciplinary measures."
      ],
      'Doctor': [
        "When faced with a diagnostic discrepancy under pressure, how do you systematically re-evaluate your primary hypothesis?",
        "How do you maintain clinical objectivity while treating a patient with a complex emotional or ethical background?",
        "What is your protocol for staying current with rapidly shifting research in your medical specialty?",
        "How do you approach the challenge of communicating terminal news with both empathy and clinical clarity?"
      ],
      'BTech Technical': [
        "If you had to optimize a system for a 100x traffic surge tonight, which core component would you harden first?",
        "How do you ensure data integrity across multiple microservices in an eventually consistent environment?",
        "What are the most critical security trade-offs when integrating a third-party payment gateway?",
        "Explain a time you chose a 'good enough' technical solution over a perfect one to meet a strategic deadline."
      ],
      'default': [
        "Given the current shifts in your industry, what is one legacy standard you believe is becoming obsolete?",
        "How do you balance short-term operational wins with the long-term strategic health of your projects?",
        "What is one area of professional knowledge where you feel you've made the most significant growth recently?",
        "How do you navigate ambiguity when project requirements shift midway through execution?"
      ]
    };
    
    const roleFallbacks = fallbacks[roleKey] || fallbacks['default'];
    // Filter history to avoid repeating even in fallback mode
    const freshFallback = roleFallbacks.find(f => !input.previousQuestions?.includes(f)) || roleFallbacks[Math.floor(Math.random() * roleFallbacks.length)];

    return {
      verbalReaction: "I see your perspective on that logic. Let's explore a different dimension of your background.",
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
