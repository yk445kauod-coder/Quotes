
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "EGP") {
  const formatted = new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    numberingSystem: "arab", // Ensure Arabic-Indic numerals are used
    notation: 'standard', // Add this to ensure consistency
  }).format(amount);
  
  // Replace the standard Arabic decimal separator (top comma) with a period (bottom dot).
  return formatted.replace(/٫/g, '.');
}

/**
 * Formats a number to a string using Hindi (Arabic-Indic) numerals without grouping separators.
 * @param num The number to format.
 * @returns A string representation of the number with Hindi numerals.
 */
export function formatNumberToHindi(num: number): string {
    if (typeof num !== 'number') return '';
    return new Intl.NumberFormat('ar-EG-u-nu-arab', { useGrouping: false }).format(num);
}

const westernArabicToHindiMap: { [key: string]: string } = {
  '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
  '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
};

/**
 * A smart function that converts Western Arabic numerals to Hindi numerals
 * and ensures there is a single space between numbers and adjacent non-numeric/non-space characters.
 * @param text The input string.
 * @returns The string with Hindi numerals and proper spacing.
 */
export function formatTextWithHindiNumerals(text: string): string {
  if (typeof text !== 'string') return '';
  
  // Step 1: Convert all western numerals to hindi numerals
  let processedText = text.replace(/[0-9]/g, (match) => westernArabicToHindiMap[match] || match);

  // Step 2: Use regular expressions to add spacing correctly.
  // This looks for a digit next to a non-digit/non-space character and adds a space.
  // It handles cases at the beginning and end of the string.

  // Add space after a number if it's followed by a letter (e.g., "14%قيمة" -> "14% قيمة")
  // The negative lookbehind `(?<!\s)` ensures we don't add a space if one already exists.
  processedText = processedText.replace(/([٠-٩.,%—-]+)(?![٠-٩.,%—\s])(\S)/g, '$1 $2');
  
  // Add space before a number if it's preceded by a letter (e.g., "قيمة14%") -> "قيمة 14%")
  processedText = processedText.replace(/(\S)(?<!\s[٠-٩.,%—])([٠-٩])/g, '$1 $2');

  return processedText;
}


