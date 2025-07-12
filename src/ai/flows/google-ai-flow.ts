'use server';
/**
 * @fileOverview A flow that generates text or images using Google AI.
 *
 * - googleAIGenerate - A function that handles the generation process.
 * - GoogleAIGenerateInput - The input type for the googleAIGenerate function.
 * - GoogleAIGenerateOutput - The return type for the googleAIGenerate function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { generate } from 'genkit/generate';

const GoogleAIGenerateInputSchema = z.object({
  prompt: z.string().describe('The user prompt for text or image generation.'),
  apiKey: z.string().describe('The Google AI API Key.'),
});
export type GoogleAIGenerateInput = z.infer<typeof GoogleAIGenerateInputSchema>;

const GoogleAIGenerateOutputSchema = z.object({
  content: z.string().describe('The generated text or image data URI.'),
});
export type GoogleAIGenerateOutput = z.infer<typeof GoogleAIGenerateOutputSchema>;

export async function googleAIGenerate(input: GoogleAIGenerateInput): Promise<GoogleAIGenerateOutput> {
  return googleAIGenerateFlow(input);
}

// Simple check to see if the prompt is asking for an image
function isImagePrompt(prompt: string): boolean {
    const imageKeywords = ['generate an image', 'create an image', 'draw a picture', 'an image of', 'a photo of'];
    const lowercasedPrompt = prompt.toLowerCase();
    return imageKeywords.some(keyword => lowercasedPrompt.startsWith(keyword));
}

const googleAIGenerateFlow = ai.defineFlow(
  {
    name: 'googleAIGenerateFlow',
    inputSchema: GoogleAIGenerateInputSchema,
    outputSchema: GoogleAIGenerateOutputSchema,
  },
  async ({ prompt, apiKey }) => {
    if (isImagePrompt(prompt)) {
        // Image Generation
        const { media } = await generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: prompt,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
            auth: apiKey,
        });

        if (!media?.url) {
            throw new Error('Image generation failed to produce an image.');
        }
        return { content: media.url };

    } else {
        // Text Generation
        const { text } = await generate({
            model: 'googleai/gemini-2.0-flash',
            prompt: prompt,
            auth: apiKey,
        });
        return { content: text };
    }
  }
);
