export type Festival = {
  id: string;
  name: string;
  date: string; // ISO string (date only)
  type: "holiday" | "festival" | "other";
};

export const INDIAN_FESTIVALS_2026: Festival[] = [
  { id: "f1", name: "New Year's Day", date: "2026-01-01", type: "holiday" },
  { id: "f2", name: "Makar Sankranti", date: "2026-01-14", type: "festival" },
  { id: "f3", name: "Republic Day", date: "2026-01-26", type: "holiday" },
  { id: "f4", name: "Maha Shivaratri", date: "2026-02-15", type: "festival" },
  { id: "f5", name: "Holi", date: "2026-03-04", type: "festival" },
  { id: "f6", name: "Gudi Padwa", date: "2026-03-19", type: "festival" },
  { id: "f7", name: "Ram Navami", date: "2026-03-27", type: "festival" },
  { id: "f8", name: "Eid-ul-Fitr", date: "2026-03-20", type: "festival" },
  { id: "f9", name: "Dr. Ambedkar Jayanti", date: "2026-04-14", type: "holiday" },
  { id: "f10", name: "Buddha Purnima", date: "2026-05-01", type: "festival" },
  { id: "f11", name: "Independence Day", date: "2026-08-15", type: "holiday" },
  { id: "f12", name: "Raksha Bandhan", date: "2026-08-28", type: "festival" },
  { id: "f13", name: "Janmashtami", date: "2026-09-04", type: "festival" },
  { id: "f14", name: "Ganesh Chaturthi", date: "2026-09-14", type: "festival" },
  { id: "f15", name: "Gandhi Jayanti", date: "2026-10-02", type: "holiday" },
  { id: "f16", name: "Dussehra", date: "2026-10-20", type: "festival" },
  { id: "f17", name: "Diwali", date: "2026-11-08", type: "festival" },
  { id: "f18", name: "Guru Nanak Jayanti", date: "2026-11-24", type: "festival" },
  { id: "f19", name: "Christmas Day", date: "2026-12-25", type: "holiday" },
];
