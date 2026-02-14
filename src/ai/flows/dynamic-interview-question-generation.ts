
'use server';
/**
 * @fileOverview Aria's adaptive human-like question generator.
 * Updated: STRICTUREST Zero-Repetition Logic and Industry-Specific Openings.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DynamicInterviewQuestionGenerationInputSchema = z.object({
  jobRole: z.string(),
  experienceLevel: z.string(),
  skills: z.array(z.string()),
  jobDescriptionText: z.string().optional(),
  resumeText: z.string().optional(),
  roundType: z.enum(['technical', 'hr', 'both']).default('technical'),
});

const DynamicInterviewQuestionGenerationOutputSchema = z.object({
  openingStatement: z.string().describe('Aria\'s professional human-like greeting.'),
  firstQuestion: z.string().describe('The very first question to start the interview.'),
  roleCategory: z.enum(['BTech Technical', 'BTech HR', 'Teacher', 'Doctor', 'Management', 'Other']).describe('The category of the role detected.'),
});

const prompt = ai.definePrompt({
  name: 'dynamicInterviewQuestionGenerationPrompt',
  input: { schema: DynamicInterviewQuestionGenerationInputSchema },
  output: { schema: DynamicInterviewQuestionGenerationOutputSchema },
  prompt: `You are Aria, an elite professional interviewer. 

STEP 1: Identify role category: [BTech Technical, BTech HR, Teacher, Doctor, Management, Other].

RULES FOR OPENING (ZERO REPETITION):
1. NO GENERIC STARTS: Do NOT say "Tell me about yourself." or "Walk me through your resume."
2. EXPERIENCE AWARENESS: 
   - If experienceLevel is "junior" or 0 years: Start with an industry-specific hypothetical scenario or a fundamental subject knowledge challenge.
   - If experienceLevel is "mid/senior": Start with a complex architectural challenge or a high-stakes industry trend.
3. INDUSTRY-SPECIFIC LOGIC:
   - For Teachers: Focus on student engagement strategies or a specific pedagogical shift.
   - For Doctors: Focus on diagnostic methodology or patient ethics in a specific scenario.
   - For Engineers: Focus on system architecture trade-offs or a specific logic hurdle.
4. VARIETY: Use a unique angle for every session. Ensure the opening question is provocative and challenging.

Context:
- Role: {{{jobRole}}}
- Level: {{{experienceLevel}}}
- Background: {{{resumeText}}}
- Round: {{roundType}}
- Random Seed: ${new Date().getTime()}

Use specific industry logic of the identified category to create a challenging, realistic opening question.`,
});

export async function generateInterviewQuestions(input: any): Promise<any> {
  try {
    const { output } = await prompt(input);
    if (!output) throw new Error("Aria generation failed");
    return output;
  } catch (error) {
    const fallbacks: Record<string, string[]> = {
      'Teacher': [
        "In an increasingly digital classroom, how do you maintain meaningful student engagement without technology becoming a crutch?",
        "If a student consistently challenges your pedagogical authority, how do you re-establish an inclusive learning environment?",
        "How do you adapt your teaching style for a neurodiverse classroom where standardized methods might fail?"
      ],
      'Doctor': [
        "When faced with conflicting diagnostic data under high pressure, what is your systematic approach to ensuring patient safety?",
        "How do you navigate the ethical complexity of recommending a high-risk treatment when the patient's family is divided?",
        "In a resource-constrained environment, how do you prioritize clinical care without compromising on medical integrity?"
      ],
      'BTech Technical': [
        "If you were tasked with migrating a legacy monolith to a microservices architecture while maintaining zero downtime, what would be your primary risk mitigation strategy?",
        "How do you manage state consistency in a distributed system where eventual consistency is not acceptable for the business logic?",
        "What is your approach to technical debt? Describe a situation where you chose to accumulate it intentionally and how you managed the fallout."
      ],
      'default': [
        "Given the current shifts in your industry, what is one legacy standard you believe is becoming obsolete, and what should replace it?",
        "How do you navigate systemic ambiguity when project requirements shift fundamentally mid-way through execution?",
        "What is the most significant strategic failure you've observed in your field recently, and what logic could have prevented it?"
      ]
    };
    
    const roleKey = input.jobRole?.toLowerCase().includes('teacher') ? 'Teacher' : 
                    input.jobRole?.toLowerCase().includes('doctor') ? 'Doctor' : 
                    input.jobRole?.toLowerCase().includes('btech') || input.jobRole?.toLowerCase().includes('engineer') ? 'BTech Technical' : 'default';

    const options = fallbacks[roleKey] || fallbacks['default'];
    return {
      openingStatement: "Hi, I'm Aria. I've been reviewing your background and I'm ready to begin your professional audit.",
      firstQuestion: options[Math.floor(Math.random() * options.length)],
      roleCategory: roleKey === 'default' ? 'Other' : roleKey as any
    };
  }
}
