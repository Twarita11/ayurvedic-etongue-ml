'use client';

import { cn } from "@/lib/utils";

export function GradeDisplay({ grade }: { grade: string }) {
  const gradeConfig = {
    A: { color: "text-chart-2" },
    B: { color: "text-chart-3" },
    C: { color: "text-chart-4" },
    D: { color: "text-chart-1" },
  };

  const config = gradeConfig[grade as keyof typeof gradeConfig] || gradeConfig.D;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <span
        key={grade}
        className={cn(
          "font-headline font-extrabold leading-none animate-in fade-in zoom-in-50 duration-500",
          "text-[12rem] sm:text-[16rem] md:text-[24rem] lg:text-[32rem]",
          config.color
        )}
      >
        {grade}
      </span>
    </div>
  );
}
