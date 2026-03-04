export type SampleType = "BLOOD" | "URINE" | "TISSUE";
export type Priority = "STAT" | "URGENT" | "ROUTINE";
export type Speciality =
  | "BLOOD"
  | "URINE"
  | "TISSUE"
  | "GENERAL"
  | "CHEMISTRY"
  | "MICROBIOLOGY"
  | "IMMUNOLOGY"
  | "GENETICS";
export type EquipmentType =
  | "BLOOD"
  | "CHEMISTRY"
  | "MICROBIOLOGY"
  | "IMMUNOLOGY"
  | "GENETICS";

// ==============================
// Input Structures
// ==============================

export interface Sample {
  id: string;
  type: SampleType;
  analysisType: string;
  priority: Priority;
  analysisTime: number;
  arrivalTime: string;
  patientId?: string;
}

export interface Technician {
  id: string;
  name?: string;
  speciality: Speciality[];
  efficiency: number;
  startTime: string;
  endTime: string;
  lunchBreak: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  compatibleTypes: string[];
  available: boolean;
  maintenanceWindow?: string;
  cleaningTime: number;
}

export interface LabData {
  samples: Sample[];
  technicians: Technician[];
  equipment: Equipment[];
}

// ==============================
// Output Structures
// ==============================

export interface ScheduleEntry {
  sampleId: string;
  technicianId: string;
  equipmentId: string;
  startTime: string;
  endTime: string;
  priority: Priority;
  duration?: number;
  efficiency?: number;
  cleaningRequired?: boolean;
  analysisType?: string;
  lunchBreak?: string | null;
}

export interface Metrics {
  totalTime: number;
  efficiency: number;
  conflicts: number;
  averageWaitTime: {
    STAT: number;
    URGENT: number;
    ROUTINE: number;
  };
  technicianUtilization: number;
  priorityRespectRate: number;
  parallelAnalyses: number;
  lunchInterruptions: number;
}

export interface LunchBreakRecord {
  technicianId: string;
  planned: string;
  actual: string;
  reason: string;
}

export interface Metadata {
  lunchBreaks: LunchBreakRecord[];
  constraintsApplied: string[];
}

export interface PlanifyResult {
  schedule: ScheduleEntry[];
  metrics: Metrics;
  metadata: Metadata;
}
