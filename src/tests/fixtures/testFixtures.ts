import { LabData, Speciality } from "../../models/types";

// ── Shared base objects ───────────────────────────────────────────────────────

const baseTechnician = {
  id: "T001",
  name: "Alice Martin",
  speciality: ["BLOOD"] as Speciality[],
  efficiency: 1.0,
  startTime: "08:00",
  endTime: "17:00",
  lunchBreak: "12:00-13:00",
};

const baseEquipment = {
  id: "E001",
  name: "Analyseur Sang",
  type: "BLOOD" as const,
  compatibleTypes: [
    "Bilan lipidique",
    "Hémogramme",
    "Numération",
    "Coagulation",
  ],
  available: true,
  cleaningTime: 10,
};

// ── Example 1: Single sample ──────────────────────────────────────────────────
export const example1: LabData = {
  samples: [
    {
      id: "S001",
      type: "BLOOD",
      analysisType: "Bilan lipidique",
      priority: "URGENT",
      analysisTime: 30,
      arrivalTime: "09:00",
    },
  ],
  technicians: [baseTechnician],
  equipment: [baseEquipment],
};

// ── Example 2: STAT vs URGENT ─────────────────────────────────────────────────
export const example2: LabData = {
  samples: [
    {
      id: "S001",
      type: "BLOOD",
      analysisType: "Bilan lipidique",
      priority: "URGENT",
      analysisTime: 45,
      arrivalTime: "09:00",
    },
    {
      id: "S002",
      type: "BLOOD",
      analysisType: "Numération",
      priority: "STAT",
      analysisTime: 30,
      arrivalTime: "09:30",
    },
  ],
  technicians: [baseTechnician],
  equipment: [baseEquipment],
};

// ── Example 3: Parallel scheduling ───────────────────────────────────────────
export const example3: LabData = {
  samples: [
    {
      id: "S001",
      type: "BLOOD",
      analysisType: "Bilan lipidique",
      priority: "URGENT",
      analysisTime: 60,
      arrivalTime: "09:00",
    },
    {
      id: "S002",
      type: "BLOOD",
      analysisType: "Numération",
      priority: "URGENT",
      analysisTime: 30,
      arrivalTime: "09:15",
    },
    {
      id: "S003",
      type: "BLOOD",
      analysisType: "Hémogramme",
      priority: "ROUTINE",
      analysisTime: 45,
      arrivalTime: "09:00",
    },
  ],
  technicians: [
    baseTechnician,
    { ...baseTechnician, id: "T002", name: "Bob Dupont" },
  ],
  equipment: [baseEquipment, { ...baseEquipment, id: "E002" }],
};
