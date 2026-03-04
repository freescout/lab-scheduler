// src/scheduler/validator.ts
import { LabData } from "../models/types";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateLabData(data: LabData): ValidationResult {
  const errors: ValidationError[] = [];

  // --- Samples ---
  if (!data.samples || data.samples.length === 0) {
    errors.push({
      field: "samples",
      message: "Au moins un échantillon est requis",
    });
  }

  for (const sample of data.samples ?? []) {
    if (!sample.id) {
      errors.push({
        field: `sample.id`,
        message: `Échantillon sans identifiant`,
      });
    }
    if (!["STAT", "URGENT", "ROUTINE"].includes(sample.priority)) {
      errors.push({
        field: `sample.${sample.id}.priority`,
        message: `Priorité invalide: ${sample.priority}`,
      });
    }
    if (!["BLOOD", "URINE", "TISSUE"].includes(sample.type)) {
      errors.push({
        field: `sample.${sample.id}.type`,
        message: `Type invalide: ${sample.type}`,
      });
    }
    if (!sample.analysisType) {
      errors.push({
        field: `sample.${sample.id}.analysisType`,
        message: `analysisType manquant`,
      });
    }
    if (!sample.analysisTime || sample.analysisTime <= 0) {
      errors.push({
        field: `sample.${sample.id}.analysisTime`,
        message: `analysisTime doit être > 0`,
      });
    }
    if (!sample.arrivalTime || !/^\d{2}:\d{2}$/.test(sample.arrivalTime)) {
      errors.push({
        field: `sample.${sample.id}.arrivalTime`,
        message: `Format arrivalTime invalide: ${sample.arrivalTime}`,
      });
    }
  }

  // --- Technicians ---
  if (!data.technicians || data.technicians.length === 0) {
    errors.push({
      field: "technicians",
      message: "Au moins un technicien est requis",
    });
  }

  for (const tech of data.technicians ?? []) {
    if (!tech.id) {
      errors.push({
        field: `technician.id`,
        message: `Technicien sans identifiant`,
      });
    }
    if (!tech.speciality || tech.speciality.length === 0) {
      errors.push({
        field: `technician.${tech.id}.speciality`,
        message: `Spécialité manquante`,
      });
    }
    if (!tech.efficiency || tech.efficiency <= 0) {
      errors.push({
        field: `technician.${tech.id}.efficiency`,
        message: `Efficacité doit être > 0`,
      });
    }
    if (!tech.startTime || !/^\d{2}:\d{2}$/.test(tech.startTime)) {
      errors.push({
        field: `technician.${tech.id}.startTime`,
        message: `Format startTime invalide`,
      });
    }
    if (!tech.endTime || !/^\d{2}:\d{2}$/.test(tech.endTime)) {
      errors.push({
        field: `technician.${tech.id}.endTime`,
        message: `Format endTime invalide`,
      });
    }
    if (
      !tech.lunchBreak ||
      !/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(tech.lunchBreak)
    ) {
      errors.push({
        field: `technician.${tech.id}.lunchBreak`,
        message: `Format lunchBreak invalide`,
      });
    }
  }

  // --- Equipment ---
  if (!data.equipment || data.equipment.length === 0) {
    errors.push({
      field: "equipment",
      message: "Au moins un équipement est requis",
    });
  }

  for (const equip of data.equipment ?? []) {
    if (!equip.id) {
      errors.push({
        field: `equipment.id`,
        message: `Équipement sans identifiant`,
      });
    }
    if (!equip.compatibleTypes || equip.compatibleTypes.length === 0) {
      errors.push({
        field: `equipment.${equip.id}.compatibleTypes`,
        message: `compatibleTypes manquant`,
      });
    }
    if (equip.cleaningTime < 0) {
      errors.push({
        field: `equipment.${equip.id}.cleaningTime`,
        message: `cleaningTime doit être >= 0`,
      });
    }
    if (
      equip.maintenanceWindow &&
      !/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(equip.maintenanceWindow)
    ) {
      errors.push({
        field: `equipment.${equip.id}.maintenanceWindow`,
        message: `Format maintenanceWindow invalide`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
