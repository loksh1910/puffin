import { Person } from "./split-types";

export const ME: Person = {
  id: "me",
  name: "You",
  short: "You",
  initials: "ME",
  upi: "you@fin",
  gradient: "linear-gradient(135deg,#2e1a47,#6a3de8)",
};

export const CONTACTS: Person[] = [
  { id: "aditi", name: "Aditi Sharma", short: "Aditi", initials: "AS", upi: "aditi.sharma@okhdfc", gradient: "linear-gradient(135deg,#9333ea,#ff5fa2)" },
  { id: "rahul", name: "Rahul Kapoor", short: "Rahul", initials: "RK", upi: "rahul.k@oksbi", gradient: "linear-gradient(135deg,#6a3de8,#9333ea)" },
  { id: "neha", name: "Neha Jain", short: "Neha", initials: "NJ", upi: "nehajain@ybl", gradient: "linear-gradient(135deg,#c026d3,#ff8bc6)" },
  { id: "mom", name: "Mom", short: "Mom", initials: "M", upi: "mom@okicici", gradient: "linear-gradient(135deg,#ff5fa2,#ffb3d9)" },
  { id: "arjun", name: "Arjun Mehta", short: "Arjun", initials: "AM", upi: "arjun.mehta@okaxis", gradient: "linear-gradient(135deg,#0ea5e9,#6366f1)" },
  { id: "priya", name: "Priya Nair", short: "Priya", initials: "PN", upi: "priya.nair@ybl", gradient: "linear-gradient(135deg,#f97316,#ec4899)" },
  { id: "kabir", name: "Kabir Singh", short: "Kabir", initials: "KS", upi: "kabirsingh@okhdfc", gradient: "linear-gradient(135deg,#14b8a6,#6366f1)" },
  { id: "sneha", name: "Sneha Iyer", short: "Sneha", initials: "SI", upi: "sneha.iyer@oksbi", gradient: "linear-gradient(135deg,#a855f7,#6366f1)" },
  { id: "vikram", name: "Vikram Rao", short: "Vikram", initials: "VR", upi: "vikram.rao@okaxis", gradient: "linear-gradient(135deg,#2e1a47,#c026d3)" },
  { id: "zoya", name: "Zoya Khan", short: "Zoya", initials: "ZK", upi: "zoya.k@ybl", gradient: "linear-gradient(135deg,#ec4899,#f59e0b)" },
];

export const RECENT_IDS = ["aditi", "rahul", "neha", "mom"];

export const findContact = (id: string) => CONTACTS.find((c) => c.id === id);

// the recipient when a QR is "scanned"
export const QR_RECIPIENT = CONTACTS[0];

export function personFromUpi(upi: string): Person {
  const handle = upi.split("@")[0] || upi;
  return {
    id: `upi:${upi}`,
    name: upi,
    short: handle.length > 8 ? handle.slice(0, 8) + "…" : handle,
    initials: handle.slice(0, 2).toUpperCase(),
    upi,
    gradient: "linear-gradient(135deg,#8a7699,#b8a6c6)",
    unverified: true,
  };
}

// for a payee typed by name (e.g. a landlord or bank on a responsibility) rather than picked
// from contacts — same "not a saved contact" treatment as personFromUpi.
export function personFromName(name: string): Person {
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const initials = (words[0]?.[0] ?? "?") + (words[1]?.[0] ?? "");
  return {
    id: `name:${trimmed.toLowerCase()}`,
    name: trimmed,
    short: words[0] ?? trimmed,
    initials: initials.toUpperCase(),
    upi: `${trimmed.toLowerCase().replace(/\s+/g, ".")}@fin`,
    gradient: "linear-gradient(135deg,#8a7699,#b8a6c6)",
    unverified: true,
  };
}
