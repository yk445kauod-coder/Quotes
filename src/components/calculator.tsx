"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function Calculator() {
  const [input, setInput] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);

  const handleNumberClick = (value: string) => {
    if (input === "0" && value !== ".") {
      setInput(value);
    } else if (value === "." && input.includes(".")) {
      return;
    } else {
      setInput(input + value);
    }
  };

  const handleOperatorClick = (op: string) => {
    if (previousValue !== null && operator) {
      handleEqualsClick();
      setOperator(op);
    } else {
      setPreviousValue(parseFloat(input));
      setInput("0");
      setOperator(op);
    }
  };

  const handleEqualsClick = () => {
    if (previousValue === null || !operator) return;

    const currentValue = parseFloat(input);
    let result: number;

    switch (operator) {
      case "+":
        result = previousValue + currentValue;
        break;
      case "-":
        result = previousValue - currentValue;
        break;
      case "*":
        result = previousValue * currentValue;
        break;
      case "/":
        result = previousValue / currentValue;
        break;
      default:
        return;
    }

    setInput(result.toString());
    setPreviousValue(null);
    setOperator(null);
  };

  const handleClear = () => {
    setInput("0");
    setPreviousValue(null);
    setOperator(null);
  };

  const handleBackspace = () => {
    if (input.length === 1) {
      setInput("0");
    } else {
      setInput(input.slice(0, -1));
    }
  };

  const NeumorphicButton = ({
    onClick,
    children,
    className,
  }: {
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl bg-card text-foreground font-bold text-2xl transition-all duration-150",
        "shadow-[5px_5px_10px_#d0d3d9,-5px_-5px_10px_#ffffff]",
        "active:shadow-[inset_5px_5px_10px_#d0d3d9,inset_-5px_-5px_10px_#ffffff]",
        "dark:shadow-[5px_5px_12px_#1c1f23,-5px_-5px_12px_#2a2d33]",
        "dark:active:shadow-[inset_5px_5px_10px_#1c1f23,inset_-5px_-5px_10px_#2a2d33]",
        className
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="w-full max-w-sm p-6 rounded-3xl bg-background border shadow-lg">
      <div className="w-full bg-card dark:bg-secondary rounded-lg p-4 mb-6 text-right text-4xl font-mono break-all shadow-[inset_3px_3px_7px_#d0d3d9,inset_-3px_-3px_7px_#ffffff] dark:shadow-[inset_3px_3px_7px_#1c1f23,inset_-3px_-3px_7px_#2a2d33]">
        {input}
      </div>
      <div className="grid grid-cols-4 gap-4">
        <NeumorphicButton
          onClick={handleClear}
          className="col-span-2 bg-destructive/80 text-destructive-foreground active:bg-destructive"
        >
          C
        </NeumorphicButton>
        <NeumorphicButton onClick={handleBackspace} className="">
          ⌫
        </NeumorphicButton>
        <NeumorphicButton onClick={() => handleOperatorClick("/")} className="bg-primary/80 text-primary-foreground active:bg-primary">
          ÷
        </NeumorphicButton>

        <NeumorphicButton onClick={() => handleNumberClick("7")}>7</NeumorphicButton>
        <NeumorphicButton onClick={() => handleNumberClick("8")}>8</NeumorphicButton>
        <NeumorphicButton onClick={() => handleNumberClick("9")}>9</NeumorphicButton>
        <NeumorphicButton onClick={() => handleOperatorClick("*")} className="bg-primary/80 text-primary-foreground active:bg-primary">
          ×
        </NeumorphicButton>

        <NeumorphicButton onClick={() => handleNumberClick("4")}>4</NeumorphicButton>
        <NeumorphicButton onClick={() => handleNumberClick("5")}>5</NeumorphicButton>
        <NeumorphicButton onClick={() => handleNumberClick("6")}>6</NeumorphicButton>
        <NeumorphicButton onClick={() => handleOperatorClick("-")} className="bg-primary/80 text-primary-foreground active:bg-primary">
          −
        </NeumorphicButton>

        <NeumorphicButton onClick={() => handleNumberClick("1")}>1</NeumorphicButton>
        <NeumorphicButton onClick={() => handleNumberClick("2")}>2</NeumorphicButton>
        <NeumorphicButton onClick={() => handleNumberClick("3")}>3</NeumorphicButton>
        <NeumorphicButton onClick={() => handleOperatorClick("+")} className="bg-primary/80 text-primary-foreground active:bg-primary">
          +
        </NeumorphicButton>

        <NeumorphicButton onClick={() => handleNumberClick("0")} className="col-span-2">
          0
        </NeumorphicButton>
        <NeumorphicButton onClick={() => handleNumberClick(".")}>.</NeumorphicButton>
        <NeumorphicButton onClick={handleEqualsClick} className="bg-primary/80 text-primary-foreground active:bg-primary">
          =
        </NeumorphicButton>
      </div>
    </div>
  );
}
