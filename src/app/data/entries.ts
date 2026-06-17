export type HueFamily = "warm" | "cool" | "neutral";

export interface DiaryEntry {
  id: string;
  name: string;
  location: string;
  country: string;
  date: string; // ISO 8601
  colors: string[];
  photoUrl: string;
  note: string;
  hue: HueFamily;
}

export const SAMPLE_ENTRIES: DiaryEntry[] = [
  {
    id: "1",
    name: "6am Tokyo. The vending machine was the only warm thing on the whole block.",
    location: "Tokyo",
    country: "Japan",
    date: "2024-11-14",
    colors: ["#E8432E", "#F5A114", "#1C2B52", "#2A1F3D", "#C43020"],
    photoUrl:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=440&h=587&fit=crop&auto=format",
    note: "A vending machine in an otherwise lightless alley.",
    hue: "warm",
  },
  {
    id: "2",
    name: "3pm Lisbon. Every wall is a different shade of the same exhausted yellow.",
    location: "Lisbon",
    country: "Portugal",
    date: "2024-10-22",
    colors: ["#D4A030", "#C08840", "#A87050", "#E8C060", "#8C5C30"],
    photoUrl:
      "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=440&h=587&fit=crop&auto=format",
    note: "Walked the same street three times just for the light.",
    hue: "warm",
  },
  {
    id: "3",
    name: "Dusk, Highway 1. The fog came in before the light left.",
    location: "Big Sur",
    country: "California",
    date: "2024-09-08",
    colors: ["#B0B8BC", "#8A9499", "#CEC8C0", "#6E7C82", "#D8D2CA"],
    photoUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=440&h=587&fit=crop&auto=format",
    note: "Pulled over. Stayed for an hour.",
    hue: "neutral",
  },
  {
    id: "4",
    name: "2pm Oaxaca. The market stall sold nothing but one colour.",
    location: "Oaxaca",
    country: "Mexico",
    date: "2024-08-15",
    colors: ["#C4234A", "#E04468", "#8C1830", "#D83858", "#F06080"],
    photoUrl:
      "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=440&h=587&fit=crop&auto=format",
    note: "Cochineal dye. Twelve baskets deep.",
    hue: "warm",
  },
  {
    id: "5",
    name: "Morning, Kyoto. Rain on old stone is the quietest grey in existence.",
    location: "Kyoto",
    country: "Japan",
    date: "2024-07-30",
    colors: ["#6A7880", "#4C5C64", "#8C9CA4", "#384850", "#A8B4B8"],
    photoUrl:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=440&h=587&fit=crop&auto=format",
    note: "The temple was empty. That was the point.",
    hue: "cool",
  },
  {
    id: "6",
    name: "4pm Copenhagen. The canal had no opinion about the sky.",
    location: "Copenhagen",
    country: "Denmark",
    date: "2024-06-18",
    colors: ["#4C7498", "#305878", "#6890B0", "#243C58", "#84A8C4"],
    photoUrl:
      "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=440&h=587&fit=crop&auto=format",
    note: "Sat on the edge for forty minutes eating a pastry.",
    hue: "cool",
  },
  {
    id: "7",
    name: "Noon, Lagos. Every shadow here has colour in it.",
    location: "Lagos",
    country: "Nigeria",
    date: "2024-05-10",
    colors: ["#C4601A", "#E8803A", "#A04810", "#D47030", "#F0A060"],
    photoUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=440&h=587&fit=crop&auto=format",
    note: "No shadow reads as pure black. They're all leaning warm.",
    hue: "warm",
  },
  {
    id: "8",
    name: "7pm Oslo. The light does something specific to white walls at this hour.",
    location: "Oslo",
    country: "Norway",
    date: "2024-03-25",
    colors: ["#D8D4CC", "#B8B2A8", "#A0988E", "#E8E4DC", "#787068"],
    photoUrl:
      "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=440&h=587&fit=crop&auto=format",
    note: "Gold hour hits different this far north.",
    hue: "neutral",
  },
];
