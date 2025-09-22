
'use client';
import * as React from 'react';
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Rasa = {
  name: string;
  dilution: number;
  quality: number;
};

// A new Progress component that accepts an indicatorClassName prop
const CustomProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorClassName)}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
CustomProgress.displayName = "CustomProgress";


function RasaItem({ name, dilution, quality }: Rasa) {
  const getProgressColor = (value: number) => {
    if (value > 75) return "bg-green-500";
    if (value > 40) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  return (
    <div className="p-4 rounded-lg border bg-card-nested transition-all hover:shadow-md">
      <h3 className="text-base font-headline font-semibold text-primary">{name}</h3>
      <div className="mt-3 space-y-3">
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <label className="text-xs text-muted-foreground">Dilution</label>
            <span className="text-xs font-medium">{dilution.toFixed(0)}%</span>
          </div>
          <CustomProgress value={dilution} className="h-2" indicatorClassName={getProgressColor(dilution)} />
        </div>
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <label className="text-xs text-muted-foreground">Quality</label>
            <span className="text-xs font-medium">{quality.toFixed(0)}%</span>
          </div>
          <CustomProgress value={quality} className="h-2" indicatorClassName={getProgressColor(quality)} />
        </div>
      </div>
    </div>
  );
}


export function RasaDetails({ rasas }: { rasas: Rasa[] }) {
  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="font-headline text-xl">Rasa Analysis</CardTitle>
        <CardDescription>
          The six basic taste modalities: sweet, sour, salty, bitter, pungent, and astringent.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rasas.map(rasa => (
          <RasaItem key={rasa.name} {...rasa} />
        ))}
      </CardContent>
    </Card>
  );
}
