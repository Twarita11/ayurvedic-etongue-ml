
'use client';

import { useState, useEffect, useCallback } from 'react';
import { GradeDisplay } from '@/components/rasa/grade-display';
import { RasaDetails } from '@/components/rasa/rasa-details';
import { ApiForm } from '@/components/rasa/api-form';
import { DataDisplay } from '@/components/rasa/data-display';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { HelpCircle } from 'lucide-react';
import { generateTasteGrade } from '@/ai/flows/generate-taste-grade';

type Rasa = {
  name: string;
  dilution: number;
  quality: number;
};

type Grade = 'A' | 'B' | 'C' | 'D';

const initialRasasData = ['Sweet', 'Sour', 'Salty', 'Bitter', 'Pungent', 'Astringent'].map(name => ({
  name,
  dilution: 0,
  quality: 0,
}));

export function RasaGraderClient({ initialGrade: initialGradeFromServer }: { initialGrade: Grade | null }) {
  const [grade, setGrade] = useState<Grade | null>(initialGradeFromServer);
  const [rasas, setRasas] = useState<Rasa[]>(initialRasasData);
  const [rawData, setRawData] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    // Set initial grade on client if not provided
    if (grade === null) {
      generateTasteGrade({ apiData: '{ "status": "initial" }' })
        .then((result: { grade: 'A' | 'B' | 'C' | 'D' }) => setGrade(result.grade))
        .catch((e: unknown) => {
          console.error("Failed to get initial grade, defaulting to 'D'", e);
          setGrade('D');
        });
    }

    // Only run on client to prevent hydration mismatch for random values
    if (!rawData) { // Only set initial random data if no data has been fetched yet
      const randomRasas = ['Sweet', 'Sour', 'Salty', 'Bitter', 'Pungent', 'Astringent'].map(name => ({
        name,
        dilution: Math.random() * 100,
        quality: Math.random() * 100,
      }));
      setRasas(randomRasas);
    }
  }, [rawData, grade]);

  const handleDataFetched = useCallback((data: { grade?: Grade; rasas?: Rasa[]; rawData?: string }) => {
    if (data.grade) setGrade(data.grade);
    if (data.rasas) setRasas(data.rasas);
    if (data.rawData) setRawData(data.rawData);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-dvh w-screen bg-background font-body text-foreground overflow-hidden">
      <header className="absolute top-0 left-0 p-4 md:p-8 z-10 flex justify-between w-full">
        <h1 className="text-2xl font-headline font-bold text-primary">Rasa Grader</h1>
        <Menubar className="bg-transparent border-none">
          <MenubarMenu>
            <MenubarTrigger>
              <HelpCircle className="h-5 w-5" />
            </MenubarTrigger>
            <MenubarContent align="end">
              <MenubarItem>A - Excellent</MenubarItem>
              <MenubarItem>B - Good</MenubarItem>
              <MenubarItem>C - Average</MenubarItem>
              <MenubarItem>D - Poor</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </header>
      
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 pt-16 md:pt-8 h-1/3 md:h-full relative transition-all duration-500">
        {isClient && grade && <GradeDisplay grade={grade} />}
      </div>

      <div className="w-full md:w-1/2 p-4 md:p-8 space-y-4 overflow-y-auto border-t md:border-t-0 md:border-l border-border/80 bg-white/30 dark:bg-black/10 flex flex-col h-2/3 md:h-full">
        <div className="flex-grow space-y-4">
          <RasaDetails rasas={rasas} />
        </div>
        <div className="flex-shrink-0 space-y-4">
          <ApiForm onDataFetched={handleDataFetched} />
          <DataDisplay rawData={rawData} />
        </div>
      </div>
    </div>
  );
}
