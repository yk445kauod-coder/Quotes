
"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Copy, Loader2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "./ui/textarea";

export function Calculator() {
  const [input, setInput] = useState("0");
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [isResult, setIsResult] = useState(false);
  const [aiNote, setAiNote] = useState("");
  const [isProcessingAi, setIsProcessingAi] = useState(false);

  const { toast } = useToast();

  const handleNumberClick = (value: string) => {
    if (isResult) {
      setInput(value);
      setIsResult(false);
      return;
    }
    if (input === "0" && value !== ".") {
      setInput(value);
    } else if (value === "." && input.includes(".")) {
      return;
    } else {
      setInput((prev) => prev + value);
    }
  };

  const handleOperatorClick = (op: string) => {
    if (operator && previousValue && !isResult) {
      handleEqualsClick();
      setPreviousValue(input);
      setOperator(op);
    } else {
      setPreviousValue(input);
      setOperator(op);
      setInput("0");
    }
    setIsResult(false);
  };

  const handleEqualsClick = () => {
    if (previousValue === null || !operator) return;

    const current = parseFloat(input);
    const prev = parseFloat(previousValue);
    let result: number;

    switch (operator) {
      case "+":
        result = prev + current;
        break;
      case "-":
        result = prev - current;
        break;
      case "*":
        result = prev * current;
        break;
      case "/":
        if (current === 0) {
          toast({ variant: "destructive", title: "خطأ", description: "لا يمكن القسمة على صفر." });
          handleClear();
          return;
        }
        result = prev / current;
        break;
      default:
        return;
    }

    setInput(result.toString());
    setPreviousValue(null);
    setOperator(null);
    setIsResult(true);
  };

  const handleClear = () => {
    setInput("0");
    setPreviousValue(null);
    setOperator(null);
    setIsResult(false);
  };

  const handleBackspace = () => {
    if (isResult) {
      handleClear();
      return;
    }
    if (input.length === 1 || input === "-0") {
      setInput("0");
    } else {
      setInput(input.slice(0, -1));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(input);
    toast({ title: "تم النسخ!", description: `تم نسخ الرقم ${input} إلى الحافظة.` });
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key } = event;
      if (key >= "0" && key <= "9") handleNumberClick(key);
      if (key === ".") handleNumberClick(key);
      if (key === "+" || key === "-" || key === "*" || key === "/") handleOperatorClick(key);
      if (key === "Enter" || key === "=") handleEqualsClick();
      if (key === "Backspace") handleBackspace();
      if (key === "Escape") handleClear();
      if ((event.ctrlKey || event.metaKey) && key === 'c') handleCopy();
    },
    [input, operator, previousValue]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
  
  const handleAiCalculate = async () => {
      if (!aiNote) return;
      setIsProcessingAi(true);
      try {
          const response = await fetch('/api/smart-calculator', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: aiNote }),
          });
          if (!response.ok) throw new Error("فشل الاتصال بالـ API");
          const data = await response.json();
          if (data.result !== 0) {
              setInput(data.result.toString());
              setIsResult(true);
          } else {
               toast({ variant: "destructive", title: "لم يتم العثور على معادلة", description: "لم يتمكن الذكاء الاصطناعي من استنتاج عملية حسابية من النص." });
          }
      } catch (error) {
          toast({ variant: "destructive", title: "خطأ في الذكاء الاصطناعي", description: "فشل تحليل الملاحظة." });
      } finally {
          setIsProcessingAi(false);
      }
  };


  const Display = () => (
    <div className="relative w-full bg-card dark:bg-secondary rounded-lg p-4 mb-6 text-right text-4xl font-mono break-all shadow-[inset_3px_3px_7px_#d0d3d9,inset_-3px_-3px_7px_#ffffff] dark:shadow-[inset_3px_3px_7px_#1c1f23,inset_-3px_-3px_7px_#2a2d33] flex items-center justify-between">
      <span>{input}</span>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
        <Copy className="h-5 w-5" />
      </Button>
    </div>
  );

  const NeumorphicButton = ({ onClick, children, className }: { onClick: () => void; children: React.ReactNode; className?: string; }) => (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl bg-background text-foreground font-bold text-2xl transition-all duration-150 aspect-square flex items-center justify-center",
        "shadow-[5px_5px_10px_#bfc3c9,-5px_-5px_10px_#ffffff]",
        "active:shadow-[inset_5px_5px_10px_#bfc3c9,inset_-5px_-5px_10px_#ffffff]",
        "dark:shadow-[5px_5px_12px_#1c1f23,-5px_-5px_12px_#2a2d33]",
        "dark:active:shadow-[inset_5px_5px_10px_#1c1f23,inset_-5px_-5px_10px_#2a2d33]",
        className
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="w-full max-w-sm mx-auto p-6 rounded-3xl bg-background border shadow-lg">
            <Display />
            <div className="grid grid-cols-4 gap-4">
                <NeumorphicButton onClick={handleClear} className="col-span-2 bg-destructive/80 text-destructive-foreground active:bg-destructive">C</NeumorphicButton>
                <NeumorphicButton onClick={handleBackspace}>⌫</NeumorphicButton>
                <NeumorphicButton onClick={() => handleOperatorClick("/")} className="bg-primary/80 text-primary-foreground active:bg-primary">÷</NeumorphicButton>

                <NeumorphicButton onClick={() => handleNumberClick("7")}>7</NeumorphicButton>
                <NeumorphicButton onClick={() => handleNumberClick("8")}>8</NeumorphicButton>
                <NeumorphicButton onClick={() => handleNumberClick("9")}>9</NeumorphicButton>
                <NeumorphicButton onClick={() => handleOperatorClick("*")} className="bg-primary/80 text-primary-foreground active:bg-primary">×</NeumorphicButton>

                <NeumorphicButton onClick={() => handleNumberClick("4")}>4</NeumorphicButton>
                <NeumorphicButton onClick={() => handleNumberClick("5")}>5</NeumorphicButton>
                <NeumorphicButton onClick={() => handleNumberClick("6")}>6</NeumorphicButton>
                <NeumorphicButton onClick={() => handleOperatorClick("-")} className="bg-primary/80 text-primary-foreground active:bg-primary">−</NeumorphicButton>

                <NeumorphicButton onClick={() => handleNumberClick("1")}>1</NeumorphicButton>
                <NeumorphicButton onClick={() => handleNumberClick("2")}>2</NeumorphicButton>
                <NeumorphicButton onClick={() => handleNumberClick("3")}>3</NeumorphicButton>
                <NeumorphicButton onClick={() => handleOperatorClick("+")} className="bg-primary/80 text-primary-foreground active:bg-primary">+</NeumorphicButton>

                <NeumorphicButton onClick={() => handleNumberClick("0")} className="col-span-2">0</NeumorphicButton>
                <NeumorphicButton onClick={() => handleNumberClick(".")}>.</NeumorphicButton>
                <NeumorphicButton onClick={handleEqualsClick} className="bg-primary/80 text-primary-foreground active:bg-primary">=</NeumorphicButton>
            </div>
        </div>
        <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">ملاحظات ذكية</h2>
            <Textarea 
                value={aiNote}
                onChange={(e) => setAiNote(e.target.value)}
                placeholder="اكتب ملاحظة ليقوم الذكاء الاصطناعي بحسابها، مثال: 'تكلفة 10 أمتار سلك سعر المتر 15 جنيه'"
                rows={5}
            />
            <Button onClick={handleAiCalculate} disabled={isProcessingAi}>
                {isProcessingAi ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : <Wand2 className="ms-2 h-4 w-4" />}
                حساب ذكي
            </Button>
            <p className="text-sm text-muted-foreground">
                يمكنك كتابة عملية حسابية باللغة العربية وسيقوم الذكاء الاصطناعي باستنتاج المعادلة ووضع الناتج في الآلة الحاسبة.
            </p>
        </div>
    </div>
  );
}
