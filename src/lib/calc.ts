const OPERATORS = ["+", "-", "*", "/"];
const MAX_LEN = 22;

export function isOperator(ch: string) {
  return OPERATORS.includes(ch);
}

export type Evaluation =
  | { ok: true; value: number }
  | { ok: false; reason: "empty" | "divide-by-zero" };

export function evaluate(expr: string): Evaluation {
  const trimmed = expr.replace(/[+\-*/.]+$/, "");
  if (!trimmed) return { ok: false, reason: "empty" };

  const nums = trimmed.split(/[+\-*/]/).map(Number);
  const ops = trimmed.match(/[+\-*/]/g) ?? [];
  if (nums.some(Number.isNaN)) return { ok: false, reason: "empty" };

  // × and ÷ bind tighter than + and −
  const terms = [nums[0]];
  for (let i = 0; i < ops.length; i++) {
    const n = nums[i + 1];
    const last = terms.length - 1;
    if (ops[i] === "*") terms[last] *= n;
    else if (ops[i] === "/") {
      if (n === 0) return { ok: false, reason: "divide-by-zero" };
      terms[last] /= n;
    } else terms.push(ops[i] === "+" ? n : -n);
  }

  const value = terms.reduce((a, b) => a + b, 0);
  return { ok: true, value: Math.round(value * 100) / 100 };
}

export function hasOperator(expr: string) {
  return /[+\-*/]/.test(expr);
}

export function nextExpr(prev: string, key: string): string {
  if (key === "⌫") return prev.slice(0, -1);

  const segment = prev.split(/[+\-*/]/).pop() ?? "";

  if (isOperator(key)) {
    if (!prev) return prev;
    const base = prev.endsWith(".") ? prev.slice(0, -1) : prev;
    if (isOperator(base.slice(-1))) return base.slice(0, -1) + key;
    return base + key;
  }

  if (prev.length >= MAX_LEN) return prev;

  if (key === ".") {
    if (segment.includes(".")) return prev;
    return prev + (segment === "" ? "0." : ".");
  }

  const [whole, decimals] = segment.split(".");
  if (decimals !== undefined && decimals.length >= 2) return prev;
  if (decimals === undefined && whole.length >= 7) return prev;
  if (segment === "0") return prev.slice(0, -1) + key;
  return prev + key;
}

const PRETTY: Record<string, string> = { "+": "+", "-": "−", "*": "×", "/": "÷" };

export function prettyExpr(expr: string) {
  return expr.replace(/[+\-*/]/g, (op) => ` ${PRETTY[op]} `);
}
