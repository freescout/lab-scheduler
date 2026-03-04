import { LabData } from "../../models/types";

export const example1: LabData = {
  samples: [
    {
      id: "S001",
      type: "BLOOD",
      analysisType: "Hémogramme",
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
      speciality: ["BLOOD"],
      efficiency: 1.0,
      startTime: "08:00",
      endTime: "17:00",
      lunchBreak: "12:00-13:00",
    },
  ],
  equipment: [
    {
      id: "E001",
      name: "Analyseur Sang A",
      type: "BLOOD",
      compatibleTypes: ["Hémogramme"],
      available: true,
      cleaningTime: 0,
    },
  ],
};

export const example2: LabData = {
  samples: [
    {
      id: "S001",
      type: "BLOOD",
      analysisType: "Hémogramme",
      priority: "URGENT",
      analysisTime: 45,
      arrivalTime: "09:00",
      patientId: "P001",
    },
    {
      id: "S002",
      type: "BLOOD",
      analysisType: "Hémogramme",
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
      speciality: ["BLOOD"],
      efficiency: 1.0,
      startTime: "08:00",
      endTime: "17:00",
      lunchBreak: "12:00-13:00",
    },
  ],
  equipment: [
    {
      id: "E001",
      name: "Analyseur Sang A",
      type: "BLOOD",
      compatibleTypes: ["Hémogramme"],
      available: true,
      cleaningTime: 0,
    },
  ],
};

export const example3: LabData = {
  samples: [
    {
      id: "S001",
      type: "BLOOD",
      analysisType: "Hémogramme",
      priority: "URGENT",
      analysisTime: 60,
      arrivalTime: "09:00",
      patientId: "P001",
    },
    {
      id: "S002",
      type: "URINE",
      analysisType: "ECBU",
      priority: "URGENT",
      analysisTime: 30,
      arrivalTime: "09:15",
      patientId: "P002",
    },
    {
      id: "S003",
      type: "BLOOD",
      analysisType: "Hémogramme",
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
      speciality: ["BLOOD"],
      efficiency: 1.0,
      startTime: "08:00",
      endTime: "17:00",
      lunchBreak: "12:00-13:00",
    },
    {
      id: "T002",
      name: "Bob Dupont",
      speciality: ["GENERAL"],
      efficiency: 1.0,
      startTime: "08:00",
      endTime: "17:00",
      lunchBreak: "12:00-13:00",
    },
  ],
  equipment: [
    {
      id: "E001",
      name: "Analyseur Sang A",
      type: "BLOOD",
      compatibleTypes: ["Hémogramme"],
      available: true,
      cleaningTime: 0,
    },
    {
      id: "E002",
      name: "Analyseur Urine A",
      type: "URINE",
      compatibleTypes: ["ECBU"],
      available: true,
      cleaningTime: 0,
    },
  ],
};
