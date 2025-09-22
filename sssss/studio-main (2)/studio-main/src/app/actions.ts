
'use server';

import { generateTasteGrade } from '@/ai/flows/generate-taste-grade';
import { z } from 'zod';

const rasasNames = ['Sweet', 'Sour', 'Salty', 'Bitter', 'Pungent', 'Astringent'];

type Rasa = {
  name: string;
  dilution: number;
  quality: number;
};

const schema = z.object({
  apiKey: z.string().min(1, 'API Key is required.'),
});

type State = {
  message?: string;
  grade?: 'A' | 'B' | 'C' | 'D';
  rasas?: Rasa[];
  rawData?: string;
};

export async function getTasteData(prevState: State, formData: FormData): Promise<State> {
  const validatedFields = schema.safeParse({
    apiKey: formData.get('apiKey'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid API Key format.',
    };
  }
  
  // Simulate API call using the key
  const mockApiData = {
    timestamp: new Date().toISOString(),
    apiKeyUsed: validatedFields.data.apiKey,
    measurements: rasasNames.reduce((acc, name) => {
      acc[name.toLowerCase()] = {
        dilution: Math.random() * 100,
        quality: Math.random() * 100
      };
      return acc;
    }, {} as Record<string, { dilution: number; quality: number }>)
  };

  const apiDataString = JSON.stringify(mockApiData, null, 2);

  try {
    const { grade } = await generateTasteGrade({ apiData: apiDataString });

    const newRasas = Object.entries(mockApiData.measurements).map(([name, values]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      dilution: values.dilution,
      quality: values.quality,
    }));
    
    return {
      grade,
      rasas: newRasas,
      rawData: apiDataString,
      message: 'Data fetched successfully!',
    };
  } catch (error) {
    console.error(error);
    return {
      message: 'Failed to generate grade using AI.',
    };
  }
}
