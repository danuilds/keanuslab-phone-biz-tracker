import type { Device } from "./types";
import { CONDITIONS } from "./types";

const COLOR_DE: Record<string, string> = {
  "black": "Schwarz",
  "white / silver": "Weiß/Silber",
  "white": "Weiß",
  "silver": "Silber",
  "blue": "Blau",
  "green": "Grün",
  "red": "Rot",
  "gold": "Gold",
  "purple": "Violett",
  "pink": "Rosa",
  "yellow": "Gelb",
  "titanium": "Titan",
  "natural titanium": "Titan Natur",
  "black titanium": "Titan Schwarz",
  "white titanium": "Titan Weiß",
  "blue titanium": "Titan Blau",
  "desert titanium": "Titan Wüstensand",
};

const CONDITION_DE: Record<string, { short: string; long: string }> = {
  [CONDITIONS[0]]: { short: "Neuwertig", long: "Neuwertig – keine sichtbaren Gebrauchsspuren" },
  [CONDITIONS[1]]: { short: "Sehr gut", long: "Sehr guter Zustand – nur leichte Gebrauchsspuren" },
  [CONDITIONS[2]]: { short: "Gut", long: "Guter Zustand – sichtbare Gebrauchsspuren, voll funktionsfähig" },
  [CONDITIONS[3]]: { short: "Defekt", long: "Defekt – siehe Beschreibung" },
};

const TITLE_MAX = 70;

export interface Listing {
  title: string;
  description: string;
}

/** Builds a German marketplace ad (title + description) from a device record. */
export function buildListing(device: Device): Listing {
  const notes = device.notes ?? "";
  const unlocked = /unlocked|entsperrt|sim-?lock[ -]?frei/i.test(notes);
  const color = device.color ? COLOR_DE[device.color.trim().toLowerCase()] ?? device.color.trim() : undefined;
  const condition = device.condition ? CONDITION_DE[device.condition] : undefined;
  // Prefer the battery health at sale; fall back to the purchase reading.
  const battery = device.batterySold ?? device.batteryBought ?? undefined;

  const base = [device.model, device.storage, color].filter(Boolean).join(" ");
  const extras = [
    condition && condition.short !== "Defekt" ? condition.short : undefined,
    battery != null && `Akku ${battery}%`,
    unlocked && "Entsperrt",
  ].filter(Boolean) as string[];
  let title = base;
  for (const extra of extras) {
    const next = `${title} – ${extra}`;
    if (next.length <= TITLE_MAX) title = next;
  }

  const specs = [
    condition && `Zustand: ${condition.long}`,
    device.storage && `Speicher: ${device.storage}`,
    color && `Farbe: ${color}`,
    battery != null && `Akku-Kapazität: ${battery} %`,
    unlocked && "Entsperrt – funktioniert mit allen Netzen",
  ].filter(Boolean) as string[];

  const description = [
    `Verkaufe ein ${[device.model, device.storage].filter(Boolean).join(" mit ")}${color ? ` in ${color}` : ""}.`,
    specs.map((s) => `• ${s}`).join("\n"),
    ["• Vollständig geprüft und funktionsfähig", "• Auf Werkseinstellungen zurückgesetzt", "• Keine Aktivierungssperre / kein Konto verknüpft"].join("\n"),
    "Versand oder Selbstabholung möglich. Bei Fragen einfach melden!",
  ]
    .filter(Boolean)
    .join("\n\n");

  return { title, description };
}
