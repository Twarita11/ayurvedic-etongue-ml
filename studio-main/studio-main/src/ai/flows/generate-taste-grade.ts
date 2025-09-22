'use server';

/**
 * @fileOverview Generates a taste grade (A, B, C, or D) based on backend API data.
 *
 * - generateTasteGrade - A function that generates the taste grade.
 * - GenerateTasteGradeInput - The input type for the generateTasteGrade function.
 * - GenerateTasteGradeOutput - The return type for the generateTasteGrade function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTasteGradeInputSchema = z.object({
  apiData: z
    .string()
    .describe('The data fetched from the backend API.'),
});
export type GenerateTasteGradeInput = z.infer<typeof GenerateTasteGradeInputSchema>;

const GenerateTasteGradeOutputSchema = z.object({
  grade: z
    .enum(['A', 'B', 'C', 'D'])
    .describe('The generated taste grade (A, B, C, or D).'),
});
export type GenerateTasteGradeOutput = z.infer<typeof GenerateTasteGradeOutputSchema>;

export async function generateTasteGrade(input: GenerateTasteGradeInput): Promise<GenerateTasteGradeOutput> {
  return generateTasteGradeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTasteGradePrompt',
  input: {schema: GenerateTasteGradeInputSchema},
  output: {schema: GenerateTasteGradeOutputSchema},
  prompt: `You are an expert taste grader. Based on the following data from the backend API, generate a taste grade (A, B, C, or D).

API Data: {{{apiData}}}

Consider the data and return a single grade.
`,
});

const generateTasteGradeFlow = ai.defineFlow(
  {
    name: 'generateTasteGradeFlow',
    inputSchema: GenerateTasteGradeInputSchema,
    outputSchema: GenerateTasteGradeOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
