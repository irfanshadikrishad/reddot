import { Hotline } from "@/types";

export const BD_HOTLINES: Hotline[] = [
  {
    id: "1",
    name: "National Emergency",
    number: "999",
    description: "Police, fire, ambulance — 24/7 national emergency line",
    category: "police",
    available24h: true,
  },
  {
    id: "2",
    name: "Women & Child Abuse Helpline",
    number: "10921",
    description:
      "Ministry of Women & Children Affairs — violence & abuse support",
    category: "domestic_violence",
    available24h: true,
  },
  {
    id: "3",
    name: "National Child Helpline",
    number: "1098",
    description: "Child abuse, trafficking, exploitation — report & support",
    category: "child_protection",
    available24h: true,
  },
  {
    id: "4",
    name: "Ambulance",
    number: "199",
    description: "National ambulance service",
    category: "medical",
    available24h: true,
  },
  {
    id: "5",
    name: "Kaan Pete Roi (Mental Health)",
    number: "01779-554391",
    description: "Emotional support & mental health helpline",
    category: "mental_health",
    available24h: false,
  },
  {
    id: "6",
    name: "BLAST Legal Aid",
    number: "01713-130880",
    description:
      "Bangladesh Legal Aid and Services Trust — free legal help for women",
    category: "domestic_violence",
    available24h: false,
  },
  {
    id: "7",
    name: "BNWLA Helpline",
    number: "01190-003007",
    description: "Bangladesh National Women Lawyers Association",
    category: "domestic_violence",
    available24h: false,
  },
  {
    id: "8",
    name: "Fire Service",
    number: "102",
    description: "National fire service",
    category: "medical",
    available24h: true,
  },
];
