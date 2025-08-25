"use client";

import { Calculator } from "@/components/calculator";

export default function CalculatorPage() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center p-4 md:p-8">
       <h1 className="text-3xl font-bold tracking-tight mb-6">
        آلة حاسبة
      </h1>
      <Calculator />
    </div>
  );
}
