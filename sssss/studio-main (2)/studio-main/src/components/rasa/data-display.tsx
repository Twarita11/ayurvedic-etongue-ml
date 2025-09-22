
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DataDisplay({ rawData }: { rawData: string | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-xl">Live API Data</CardTitle>
        <CardDescription>The raw JSON data fetched from the backend using your API key.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48 w-full rounded-md border bg-muted/30 p-4">
          <pre className="text-sm font-code text-muted-foreground whitespace-pre-wrap break-all">
            {rawData || '// API data will be shown here...'}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
