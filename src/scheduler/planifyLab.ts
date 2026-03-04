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

// Lower number = higher priority
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

  if (schedule.length === 0) {
    return {
      schedule,
      metrics: {
        totalTime: 0,
        efficiency: 0,
        conflicts: sortedSamples.length,
        averageWaitTime: { STAT: 0, URGENT: 0, ROUTINE: 0 },
        technicianUtilization: 0,
        priorityRespectRate: 0,
        parallelAnalyses: 0,
        lunchInterruptions: 0,
      },
    };
  }

  // --- Planning window ---
  const earliestStart = Math.min(
    ...schedule.map((e) => toMinutes(e.startTime)),
  );

  const latestEnd = Math.max(...schedule.map((e) => toMinutes(e.endTime)));

  const totalTime = latestEnd - earliestStart;

  // --- Technician work time ---

  const technicianWorkTime = new Map<string, number>();

  for (const entry of schedule) {
    const duration =
      entry.duration ?? toMinutes(entry.endTime) - toMinutes(entry.startTime);

    const current = technicianWorkTime.get(entry.technicianId) ?? 0;
    technicianWorkTime.set(entry.technicianId, current + duration);
  }

  const totalWorkTime = [...technicianWorkTime.values()].reduce(
    (sum, t) => sum + t,
    0,
  );

  // Efficiency: avg work time per technician / planning window

  const efficiency =
    totalTime > 0 && technicians.length > 0
      ? Math.round((totalWorkTime / (technicians.length * totalTime)) * 1000) /
        10
      : 0;

  // Utilization: total work time / total shift capacity
  const totalShiftCapacity = technicians.reduce((sum, tech) => {
    const shiftStart = toMinutes(tech.startTime);
    const shiftEnd = toMinutes(tech.endTime);
    return sum + (shiftEnd - shiftStart);
  }, 0);

  const technicianUtilization =
    totalShiftCapacity > 0
      ? Math.round((totalWorkTime / totalShiftCapacity) * 1000) / 10
      : 0;

  const conflicts = sortedSamples.length - schedule.length;

  // --- Average wait time per priority ---
  const waitTimes: Record<Priority, number[]> = {
    STAT: [],
    URGENT: [],
    ROUTINE: [],
  };

  for (const entry of schedule) {
    const sample = samples.find((s) => s.id === entry.sampleId);
    if (!sample) continue;
    const wait = toMinutes(entry.startTime) - toMinutes(sample.arrivalTime);
    waitTimes[entry.priority].push(Math.max(0, wait));
  }

  const averageWaitTime = {
    STAT: computeAverage(waitTimes.STAT),
    URGENT: computeAverage(waitTimes.URGENT),
    ROUTINE: computeAverage(waitTimes.ROUTINE),
  };

  // --- Priority Respect Rate ---
  const sampleMap = new Map(samples.map((s) => [s.id, s]));
  const violatedSamples = new Set<string>();

  for (const high of schedule) {
    const highSample = sampleMap.get(high.sampleId);
    if (!highSample) continue;

    for (const low of schedule) {
      if (high.sampleId === low.sampleId) continue;

      const lowSample = sampleMap.get(low.sampleId);
      if (!lowSample) continue;

      const isHigherPriority =
        PRIORITY_WEIGHT[high.priority] < PRIORITY_WEIGHT[low.priority];
      const arrivedFirst =
        toMinutes(highSample.arrivalTime) <= toMinutes(lowSample.arrivalTime);
      const startedLater = toMinutes(high.startTime) > toMinutes(low.startTime);

      if (isHigherPriority && arrivedFirst && startedLater) {
        violatedSamples.add(high.sampleId);
      }
    }
  }

  // Returns 0 when nothing is scheduled (no ordering occurred)
  const priorityRespectRate =
    schedule.length > 0
      ? Math.round(
          ((schedule.length - violatedSamples.size) / schedule.length) * 1000,
        ) / 10
      : 0;

  // --- Parallel Analyses (sweep line) ---
  const events: { time: number; delta: number }[] = [];

  for (const entry of schedule) {
    events.push({ time: toMinutes(entry.startTime), delta: +1 });
    events.push({ time: toMinutes(entry.endTime), delta: -1 });
  }

  // Sort by time, ends before starts if same time
  events.sort((a, b) => a.time - b.time || a.delta - b.delta);

  let current = 0;
  let parallelAnalyses = 0;

  for (const event of events) {
    current += event.delta;
    parallelAnalyses = Math.max(parallelAnalyses, current);
  }

  // --- Final metrics object ---
  const metrics: Metrics = {
    totalTime,
    efficiency,
    conflicts,
    technicianUtilization,
    averageWaitTime,
    priorityRespectRate,
    parallelAnalyses,
    lunchInterruptions,
  };

  // 6. Return final result

  return {
    schedule,
    metrics,
  };
}
