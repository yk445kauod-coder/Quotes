"use client";

import { useLoading } from "@/context/loading-context";
import { Loader2 } from "lucide-react";

export function LoadingIndicator() {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
