import type { Tone } from "../components/ui";
import type { DeviceStatus, RepairStatus } from "./types";

export const deviceTone: Record<DeviceStatus, Tone> = {
  Acquired: "zinc",
  "In repair": "amber",
  Ready: "sky",
  Listed: "violet",
  Sold: "emerald",
};

export const repairTone: Record<RepairStatus, Tone> = {
  Intake: "zinc",
  Diagnosing: "sky",
  "Waiting parts": "amber",
  "In progress": "violet",
  Done: "blue",
  Collected: "emerald",
};
