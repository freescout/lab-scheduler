import { LabData } from "./models/types";
import { planifyLab } from "./scheduler/planifyLab";

const example1: LabData = {
  samples: [
    {
      id: "S001",
      type: "BLOOD",
      priority: "URGENT",
      analysisTime: 30,
      arrivalTime: "09:00",
      patientId: "P001",
    },
  ],
  technicians: [
    {
      id: "T001",
      name: "Alice Martin",
      speciality: "BLOOD",
      startTime: "08:00",
      endTime: "17:00",
    },
  ],
  equipment: [
    {
      id: "E001",
      name: "Analyseur Sang A",
      type: "BLOOD",
      available: true,
    },
  ],
};

// ==============================
// Example 2: STAT vs URGENT
// ==============================
const example2: LabData = {
  samples: [
    {
      id: "S001",
      type: "BLOOD",
      priority: "URGENT",
      analysisTime: 45,
      arrivalTime: "09:00",
      patientId: "P001",
    },
    {
      id: "S002",
      type: "BLOOD",
      priority: "STAT",
      analysisTime: 30,
      arrivalTime: "09:30",
      patientId: "P002",
    },
  ],
  technicians: [
    {
      id: "T001",
      name: "Alice Martin",
      speciality: "BLOOD",
      startTime: "08:00",
      endTime: "17:00",
    },
  ],
  equipment: [
    {
      id: "E001",
      name: "Analyseur Sang A",
      type: "BLOOD",
      available: true,
    },
  ],
};

// ==============================
// Example 3: Resource Management
// ==============================
const example3: LabData = {
  samples: [
    {
      id: "S001",
      type: "BLOOD",
      priority: "URGENT",
      analysisTime: 60,
      arrivalTime: "09:00",
      patientId: "P001",
    },
    {
      id: "S002",
      type: "URINE",
      priority: "URGENT",
      analysisTime: 30,
      arrivalTime: "09:15",
      patientId: "P002",
    },
    {
      id: "S003",
      type: "BLOOD",
      priority: "ROUTINE",
      analysisTime: 45,
      arrivalTime: "09:00",
      patientId: "P003",
    },
  ],
  technicians: [
    {
      id: "T001",
      name: "Alice Martin",
      speciality: "BLOOD",
      startTime: "08:00",
      endTime: "17:00",
    },
    {
      id: "T002",
      name: "Bob Dupont",
      speciality: "GENERAL",
      startTime: "08:00",
      endTime: "17:00",
    },
  ],
  equipment: [
    {
      id: "E001",
      name: "Analyseur Sang A",
      type: "BLOOD",
      available: true,
    },
    {
      id: "E002",
      name: "Analyseur Urine A",
      type: "URINE",
      available: true,
    },
  ],
};

// ==============================
// Run Tests
// ==============================
console.log("===== Example 1 =====");
console.log(JSON.stringify(planifyLab(example1), null, 2));

console.log("===== Example 2 =====");
console.log(JSON.stringify(planifyLab(example2), null, 2));

console.log("===== Example 3 =====");
console.log(JSON.stringify(planifyLab(example3), null, 2));
