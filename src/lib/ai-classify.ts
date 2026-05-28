export type Department = "HR" | "IT" | "Finance" | "Operations";

const KEYWORDS: Record<Department, string[]> = {
  IT: ["password", "computer", "laptop", "wifi", "internet", "printer", "email", "software", "login", "vpn", "network", "system", "monitor", "keyboard", "mouse", "server", "access", "account locked", "outlook", "teams", "zoom", "bug", "error", "crash"],
  HR: ["leave", "vacation", "holiday", "employee", "recruitment", "hire", "hiring", "onboarding", "benefits", "insurance", "harassment", "policy", "training", "complaint", "performance", "review", "resignation", "contract", "promotion"],
  Finance: ["salary", "invoice", "payment", "payroll", "reimbursement", "expense", "tax", "bonus", "refund", "bill", "compensation", "deduction", "bank", "transfer", "receipt", "budget"],
  Operations: ["equipment", "maintenance", "office", "supplies", "facility", "cleaning", "desk", "chair", "lighting", "ac", "air conditioning", "heating", "parking", "security", "badge", "door", "building", "furniture", "stationery"],
};

export function classifyTicket(text: string): { department: Department; confidence: number; scores: Record<Department, number> } {
  const lower = text.toLowerCase();
  const scores: Record<Department, number> = { IT: 0, HR: 0, Finance: 0, Operations: 0 };
  (Object.keys(KEYWORDS) as Department[]).forEach((dept) => {
    KEYWORDS[dept].forEach((kw) => {
      if (lower.includes(kw)) scores[dept] += 1;
    });
  });
  const entries = Object.entries(scores) as [Department, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const [topDept, topScore] = entries[0];
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const department = total === 0 ? "Operations" : topDept;
  const confidence = total === 0 ? 0.25 : Math.min(0.99, topScore / Math.max(total, 1));
  return { department, confidence, scores };
}
