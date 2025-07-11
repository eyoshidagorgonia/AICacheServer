'use server';

/**
 * @fileOverview A flow that determines whether an Ollama prompt should be cached.
 *
 * - determineCachePrompt - A function that determines if a prompt should be cached.
 * - DetermineCachePromptInput - The input type for the determineCachePrompt function.
 * - DetermineCachePromptOutput - The return type for the determineCachePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetermineCachePromptInputSchema = z.object({
  promptContent: z.string().describe('The content of the Ollama prompt.'),
});
export type DetermineCachePromptInput = z.infer<typeof DetermineCachePromptInputSchema>;

const DetermineCachePromptOutputSchema = z.object({
  shouldCache: z
    .boolean()
    .describe(
      'Whether the prompt should be cached based on its content. True indicates it should be cached, false otherwise.'
    ),
  reason: z.string().describe('The reason for the caching decision.'),
});
export type DetermineCachePromptOutput = z.infer<typeof DetermineCachePromptOutputSchema>;

export async function determineCachePrompt(input: DetermineCachePromptInput): Promise<DetermineCachePromptOutput> {
  return determineCachePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'determineCachePromptPrompt',
  input: {schema: DetermineCachePromptInputSchema},
  output: {schema: DetermineCachePromptOutputSchema},
  prompt: `You are an AI assistant that determines whether a given Ollama prompt should be cached or not.

  Your goal is to optimize storage usage by avoiding caching prompts that are unlikely to be repeated or are low-value.

  Consider the following factors when making your decision:

  - **Repetitiveness:** Is the prompt likely to be repeated in the future?
  - **Value:** Is the prompt valuable to cache? Prompts that require significant computation or access to external resources are generally more valuable to cache.
  - **Uniqueness:** Prompts containing user-specific information or personalized content are less likely to be repeated and should not be cached.

  Based on these factors, determine whether the prompt should be cached or not. Return a boolean value for 
  shouldCache (true if it should be cached, false otherwise) and provide a brief reason for your decision.

  Prompt Content: {{{promptContent}}}`,
});

const determineCachePromptFlow = ai.defineFlow(
  {
    name: 'determineCachePromptFlow',
    inputSchema: DetermineCachePromptInputSchema,
    outputSchema: DetermineCachePromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
