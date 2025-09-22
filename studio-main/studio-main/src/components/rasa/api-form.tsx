
'use client';

import { useEffect } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { getTasteData } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from 'lucide-react';

const initialState = {
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" aria-disabled={pending} className="w-full sm:w-auto">
      {pending ? 'Fetching...' : 'Fetch Data'}
      {!pending && <ArrowRight className="ml-2 h-4 w-4" />}
    </Button>
  );
}

export function ApiForm({ onDataFetched }: { onDataFetched: (data: any) => void }) {
  const [state, formAction] = useActionState(getTasteData, initialState);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!state) return;
    
    if (state.grade && state.rasas && state.rawData) {
      onDataFetched(state);
      // Avoid showing a toast on the initial fetch which might not have a message
      if(state.message && state.message !== 'Data fetched successfully!') {
        toast({
          title: "Success",
          description: state.message || "Data fetched successfully.",
        });
      }
    } else if (state.message) { // Only show error toast if it's not a success state
      toast({
        variant: "destructive",
        title: "Error",
        description: state.message,
      });
    }
  }, [state, onDataFetched, toast]);

  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Connect API</CardTitle>
          <CardDescription>Enter your API key to fetch real-time taste data from the backend.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input name="apiKey" placeholder="Enter your API Key here" required className="max-w-md" />
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </Card>
    </form>
  );
}
