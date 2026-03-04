import {
  Equipment,
  LabData,
  Metrics,
  PlanifyResult,
  Priority,
  Sample,
  ScheduleEntry,
  Technician,
} from "../models/types";
import { toHHMM, toMinutes } from "../utils/time";

const PRIORITY_WEIGHT: Record<Priority, number> = {
  STAT: 0,
  URGENT: 1,
  ROUTINE: 2,
};

function sortSamples(samples: Sample[]): Sample[] {
  return [...samples].sort((a, b) => {
    const byPriority =
      PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (byPriority !== 0) return byPriority;

    return toMinutes(a.arrivalTime) - toMinutes(b.arrivalTime);
  });
}

function isTechnicianCompatible(
  technician: Technician,
  sample: Sample,
): boolean {
  return (
    technician.speciality.includes("GENERAL") ||
    technician.speciality.some((s) => s === sample.type)
  );
}

function isEquipmentCompatible(equipment: Equipment, sample: Sample): boolean {
  return equipment.compatibleTypes.some(
    (ct) =>
      sample.analysisType.toLowerCase().includes(ct.toLowerCase()) ||
      ct.toLowerCase().includes(sample.analysisType.toLowerCase()),
  );
}

function adjustForLunchBreak(
  candidateStart: number,
  duration: number,
  lunchBreak: string,
): { start: number; lunchInterrupted: boolean } {
  const [lunchStart, lunchEnd] = lunchBreak.split("-").map(toMinutes);

  const candidateEnd = candidateStart + duration;

  // Case 1: analysis finishes before lunch starts → no conflict
  if (candidateEnd <= lunchStart) {
    return { start: candidateStart, lunchInterrupted: false };
  }

  // Case 2: analysis starts after lunch ends → no conflict
  if (candidateStart >= lunchEnd) {
    return { start: candidateStart, lunchInterrupted: false };
  }

  // Case 3: overlap → push start to after lunch
  return { start: lunchEnd, lunchInterrupted: false };
}

function isInMaintenance(
  equip: Equipment,
  candidateStart: number,
  candidateEnd: number,
): boolean {
  if (!equip.maintenanceWindow) return false;

  const [maintStart, maintEnd] = equip.maintenanceWindow
    .split("-")
    .map(toMinutes);

  // Overlap check: analysis overlaps with maintenance window
  return candidateStart < maintEnd && candidateEnd > maintStart;
}

export function planifyLab(data: LabData): PlanifyResult {
  const { samples, technicians, equipment } = data;

  // 1. Sort samples by priority and arrival time

  const sortedSamples = sortSamples(samples);

  // 2. Initialize technician availability tracking

  const technicianAvailableAt = new Map<string, number>();
  for (const technician of technicians) {
    technicianAvailableAt.set(technician.id, toMinutes(technician.startTime));
  }

  // 3. Initialize equipment availability tracking

  const equipmentAvailableAt = new Map<string, number>();
  for (const equip of equipment) {
    equipmentAvailableAt.set(
      equip.id,
      equip.available ? 0 : Number.POSITIVE_INFINITY,
    );
  }

  //Iterate over samples and assign resources
  const schedule: ScheduleEntry[] = [];
  let lunchInterruptions = 0;

  for (const sample of sortedSamples) {
    let bestStartTime: number | null = null;
    let selectedTechnicianId: string | null = null;
    let selectedEquipmentId: string | null = null;
    let selectedDuration: number | null = null;

    const sampleArrival = toMinutes(sample.arrivalTime);

    for (const technician of technicians) {
      if (!isTechnicianCompatible(technician, sample)) continue;

      const adjustedDuration = Math.round(
        sample.analysisTime / technician.efficiency,
      );

      for (const equip of equipment) {
        if (!isEquipmentCompatible(equip, sample)) continue;

        const technicianStart = toMinutes(technician.startTime);
        const technicianEnd = toMinutes(technician.endTime);

        const technicianAvailable = technicianAvailableAt.get(technician.id)!;

        const equipmentAvailable = equipmentAvailableAt.get(equip.id)!;

        let candidateStart = Math.max(
          sampleArrival,
          technicianAvailable,
          equipmentAvailable,
          technicianStart,
        );

        const { start: adjustedStart } = adjustForLunchBreak(
          candidateStart,
          adjustedDuration,
          technician.lunchBreak,
        );
        candidateStart = adjustedStart;

        const candidateEnd = candidateStart + adjustedDuration;

        if (isInMaintenance(equip, candidateStart, candidateEnd)) continue;

        if (candidateEnd > technicianEnd) continue;

        if (bestStartTime === null || candidateStart < bestStartTime) {
          bestStartTime = candidateStart;
          selectedTechnicianId = technician.id;
          selectedEquipmentId = equip.id;
          selectedDuration = adjustedDuration;
        }
      }
    }

    if (
      bestStartTime !== null &&
      selectedTechnicianId !== null &&
      selectedEquipmentId !== null &&
      selectedDuration !== null
    ) {
      const endTime = bestStartTime + selectedDuration;

      technicianAvailableAt.set(selectedTechnicianId, endTime);

      const selectedEquip = equipment.find(
        (e) => e.id === selectedEquipmentId,
      )!;
      equipmentAvailableAt.set(
        selectedEquipmentId,
        endTime + selectedEquip.cleaningTime,
      );

      const selectedTech = technicians.find(
        (t) => t.id === selectedTechnicianId,
      )!;

      schedule.push({
        sampleId: sample.id,
        technicianId: selectedTechnicianId,
        equipmentId: selectedEquipmentId,
        startTime: toHHMM(bestStartTime),
        endTime: toHHMM(endTime),
        priority: sample.priority,
        duration: selectedDuration,
        efficiency: selectedTech.efficiency,
        analysisType: sample.analysisType,
        cleaningRequired: selectedEquip.cleaningTime > 0,
      });
    }
  }

  schedule.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

  // 5. Compute metrics

  let totalTime = 0;
  let efficiency = 0;

  if (schedule.length > 0) {
    const totalAnalysisTime = schedule.reduce((sum, entry) => {
      const duration = toMinutes(entry.endTime) - toMinutes(entry.startTime);
      return sum + duration;
    }, 0);

    const firstStart = Math.min(...schedule.map((e) => toMinutes(e.startTime)));

    const lastEnd = Math.max(...schedule.map((e) => toMinutes(e.endTime)));

    totalTime = lastEnd - firstStart;

    efficiency =
      totalTime > 0 ? Math.min((totalAnalysisTime / totalTime) * 100, 100) : 0;
  }

  const conflicts = sortedSamples.length - schedule.length;

  const metrics: Metrics = {
    totalTime,
    efficiency: Math.round(efficiency * 10) / 10,
    conflicts,
  };

  // 6. Return final result

  return {
    schedule,
    metrics,
  };
}
