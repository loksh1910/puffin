// suggestion notes already lead with their own emoji; only plain-text notes get the 📝
export function noteLabel(note: string) {
  return /^\p{Extended_Pictographic}/u.test(note) ? note : `📝 ${note}`;
}

export function formatINR(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
