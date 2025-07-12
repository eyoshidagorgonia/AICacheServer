
'use server';
/**
 * @fileOverview A flow that generates text or images using Google Gemini.
 *
 * - googleGeminiGenerate - A function that handles the generation process.
 * - GoogleGeminiGenerateInput - The input type for the googleGeminiGenerate function.
 * - GoogleGeminiGenerateOutput - The return type for the googleGeminiGenerate function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { generate } from 'genkit/generate';

const GoogleGeminiGenerateInputSchema = z.object({
  prompt: z.string().describe('The user prompt for text or image generation.'),
  apiKey: z.string().describe('The Google Gemini API Key.'),
});
export type GoogleGeminiGenerateInput = z.infer<typeof GoogleGeminiGenerateInputSchema>;

const GoogleGeminiGenerateOutputSchema = z.object({
  content: z.string().describe('The generated text or image data URI.'),
});
export type GoogleGeminiGenerateOutput = z.infer<typeof GoogleGeminiGenerateOutputSchema>;

export async function googleGeminiGenerate(input: GoogleGeminiGenerateInput): Promise<GoogleGeminiGenerateOutput> {
  return googleGeminiGenerateFlow(input);
}

// Simple check to see if the prompt is asking for an image
function isImagePrompt(prompt: string): boolean {
    const imageKeywords = ['generate an image', 'create an image', 'draw a picture', 'an image of', 'a photo of'];
    const lowercasedPrompt = prompt.toLowerCase();
    return imageKeywords.some(keyword => lowercasedPrompt.includes(keyword));
}

const googleGeminiGenerateFlow = ai.defineFlow(
  {
    name: 'googleGeminiGenerateFlow',
    inputSchema: GoogleGeminiGenerateInputSchema,
    outputSchema: GoogleGeminiGenerateOutputSchema,
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
