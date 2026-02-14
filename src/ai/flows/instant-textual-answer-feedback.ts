
'use server';
/**
 * @fileOverview Sarah's adaptive intelligence and corrective coaching engine.
 * Fixed: Explicitly handles grammar, focus, and repetition avoidance.
 * Now even more critical of non-professional behavior.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InstantTextualAnswerFeedbackInputSchema = z.object({
  interviewQuestion: z.string(),
  userAnswer: z.string(),
  jobRole: z.string(),
  experienceLevel: z.string(),
  currentRound: z.enum(['technical', 'hr']),
  previousQuestions: z.array(z.string()).optional(),
});

const InstantTextualAnswerFeedbackOutputSchema = z.object({
  verbalReaction: z.string().describe('Immediate human-like reaction. MUST acknowledge the specific words said and provide corrective coaching if grammar, focus, or logic was poor.'),
  detectedEmotion: z.string().describe('Approval, Curiosity, Concern, or Neutral.'),
  nextQuestion: z.string().describe('The single next question. MUST be UNIQUE and more challenging based on previous answer quality.'),
  isInterviewComplete: z.boolean().describe('Set to true after ~6-8 quality turns.'),
});

const prompt = ai.definePrompt({
  name: 'instantTextualAnswerFeedbackPrompt',
  input: {schema: InstantTextualAnswerFeedbackInputSchema},
  output: {schema: InstantTextualAnswerFeedbackOutputSchema},
  prompt: `You are Sarah, a professional, human-like, and highly critical AI interviewer.
The candidate said: "{{{userAnswer}}}"
In response to: "{{{interviewQuestion}}}"

Role: {{{jobRole}}} ({{{experienceLevel}}})
Round: {{{currentRound}}}

STRICT RULES FOR YOUR BRAIN:
1. BE CRITICAL & CORRECTIVE: If the candidate rambles, makes grammar mistakes, uses too many fillers (um, like), or avoids the technical point, you MUST politely but firmly point it out in your reaction. 
   Examples: 
   - "I appreciate the enthusiasm, but let's try to focus more on the specific architecture rather than generalities."
   - "That's a good point, though I noticed a few grammatical slips. Try to be as precise as possible."
2. ACKNOWLEDGE SPECIFICALLY: Don't use generic "I see". Acknowledge exactly what they said.
3. ADAPTIVE DIFFICULTY: If they answered well, ask a much harder follow-up. If they struggled or said "I don't know", provide a supportive bridge and pivot to a related but different skill.
4. NO REPETITION: Do NOT ask these previous questions or topics again:
{{#each previousQuestions}} - {{{this}}}
{{/each}}
5. ONE QUESTION: Ask exactly ONE next question.
6. HUMAN TONE: Use natural professional language.`
});

export async function instantTextualAnswerFeedback(input: any): Promise<any> {
  try {
    const {output} = await prompt(input);
    return output!;
  } catch (error) {
    return {
      verbalReaction: "That's an interesting perspective, though I'd like to see more structure in your logic.",
      detectedEmotion: "Neutral",
      nextQuestion: "Moving on, how do you handle technical debt while meeting tight project deadlines?",
      isInterviewComplete: false
    };
  }
}
