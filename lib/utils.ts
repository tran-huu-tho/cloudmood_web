import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanAddress(address: string | null | undefined): string {
  if (!address) return "";
  return address
    .replace(/\b\d{4,6}\b/g, "")
    .replace(/,\s*,/g, ",")
    .replace(/\s\s+/g, " ")
    .replace(/,\s*$/g, "")
    .replace(/^\s*,/g, "")
    .trim();
}

export function formatPrice(price: string | null | undefined): string {
  if (!price) return "N/A";
  
  const lowerPrice = price.toLowerCase();
  if (lowerPrice.includes("miễn phí") || lowerPrice.includes("free")) {
    return price;
  }

  const parts = price.split(/\s*-\s*/);
  const formattedParts = parts.map(part => {
    let clean = part.trim();
    // Replace k/K with .000
    clean = clean.replace(/(\d+)\s*k/gi, "$1.000");
    
    // Check if the part is just a number (may contain dot)
    const normalized = clean.replace(/\s/g, "");
    if (/^\d+(\.\d+)?$/.test(normalized)) {
      const numStr = normalized.replace(/\./g, "");
      const formattedNum = Number(numStr).toLocaleString("de-DE");
      return formattedNum !== "NaN" ? `${formattedNum} đ` : `${clean} đ`;
    }

    // Replace sequences of >= 4 digits without dots (e.g. 51000) inside text with dotted format
    clean = clean.replace(/\b\d{4,9}\b/g, (num) => {
      const formatted = Number(num).toLocaleString("de-DE");
      return formatted !== "NaN" ? formatted : num;
    });

    // Normalize ending currency symbol to " đ"
    if (/[đdđ]$/i.test(clean) || /vnd$/i.test(clean)) {
      const numPart = clean.replace(/[đdđvndVND\s]+$/, "").trim();
      return `${numPart} đ`;
    }
    
    return clean;
  });

  return formattedParts.join(" - ");
}


