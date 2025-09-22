import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const googleApiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;

if (!googleApiKey && process.env.NODE_ENV === 'production') {
  throw new Error('Missing Google GenAI API key. Set GOOGLE_GENAI_API_KEY in the environment.');
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: googleApiKey,
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
