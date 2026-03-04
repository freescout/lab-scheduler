import { LabData } from "../models/types";
import { planifyLab } from "../scheduler/planifyLab";
import { toMinutes } from "../utils/time";
import { example1, example2, example3 } from "./fixtures/labData";

/**
 * Utility: ensures no overlapping bookings
 */
function hasOverlap(
  schedule: any[],
  resourceKey: "technicianId" | "equipmentId",
): boolean {
  const grouped: Record<string, any[]> = {};

  for (const entry of schedule) {
    if (!grouped[entry[resourceKey]]) {
      grouped[entry[resourceKey]] = [];
    }
    grouped[entry[resourceKey]].push(entry);
  }

  for (const group of Object.values(grouped)) {
    group.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

    for (let i = 1; i < group.length; i++) {
      const prevEnd = toMinutes(group[i - 1].endTime);
      const currStart = toMinutes(group[i].startTime);

      if (currStart < prevEnd) {
        return true;
      }
    }
  }

  return false;
}

describe("planifyLab", () => {
  // ==============================
  // Example 1 - Basic Scheduling
  // ==============================
  describe("Example 1 - Single Sample", () => {
    it("should schedule one sample correctly", () => {
      const result = planifyLab(example1);

      expect(result.schedule).toHaveLength(1);

      expect(result.schedule[0]).toMatchObject({
        sampleId: "S001",
        technicianId: "T001",
        equipmentId: "E001",
        startTime: "09:00",
        endTime: "09:30",
        priority: "URGENT",
      });

      expect(result.metrics.totalTime).toBe(30);
      expect(result.metrics.efficiency).toBe(100);
      expect(result.metrics.conflicts).toBe(0);
    });
  });

  // ==============================
  // Example 2 - Priority Handling
  // ==============================
  describe("Example 2 - STAT priority", () => {
    it("should prioritize STAT over URGENT", () => {
      const result = planifyLab(example2);

      expect(result.schedule).toHaveLength(2);

      // STAT must be first
      expect(result.schedule[0].sampleId).toBe("S002");
      expect(result.schedule[1].sampleId).toBe("S001");

      expect(result.metrics.totalTime).toBe(75);
      expect(result.metrics.efficiency).toBe(100);
      expect(result.metrics.conflicts).toBe(0);
    });
  });

  // ==============================
  // Example 3 - Parallel Scheduling
  // ==============================
  describe("Example 3 - Parallel scheduling", () => {
    it("should allow parallel execution without conflicts", () => {
      const result = planifyLab(example3);

      expect(result.schedule).toHaveLength(3);

      // Validate no overlap
      expect(hasOverlap(result.schedule, "technicianId")).toBe(false);
      expect(hasOverlap(result.schedule, "equipmentId")).toBe(false);

      expect(result.metrics.totalTime).toBe(105);

      // Efficiency must be between 0–100%
      // Raw value would be 128.6%, but it is capped at 100%
      expect(result.metrics.efficiency).toBeCloseTo(100, 1);

      expect(result.metrics.conflicts).toBe(0);
    });
  });

  // ==============================
  // Edge Case - No Compatible Technician
  // ==============================
  describe("Edge Case - Incompatible technician", () => {
    it("should count conflict if no technician can handle sample", () => {
      const data: LabData = {
        ...example1,
        technicians: [
          {
            id: "T999",
            name: "Wrong Specialist",
            speciality: ["URINE"],
            efficiency: 1.0,
            startTime: "08:00",
            endTime: "17:00",
            lunchBreak: "12:00-13:00",
          },
        ],
      };

      const result = planifyLab(data);

      expect(result.schedule).toHaveLength(0);
      expect(result.metrics.conflicts).toBe(1);
    });
  });

  // ==============================
  // Edge Case - Shift Boundary
  // ==============================
  describe("Edge Case - Shift boundary", () => {
    it("should not schedule analysis exceeding technician shift", () => {
      const data = {
        ...example1,
        samples: [
          {
            ...example1.samples[0],
            analysisTime: 120,
            arrivalTime: "16:00",
          },
        ],
      };

      const result = planifyLab(data);

      expect(result.schedule).toHaveLength(0);
      expect(result.metrics.conflicts).toBe(1);
    });
  });
});

// ==============================
// Intermediate - Efficiency
// ==============================
describe("Intermediate - Technician efficiency", () => {
  it("should apply technician efficiency to duration", () => {
    const data = JSON.parse(JSON.stringify(example1));

    data.samples[0].analysisTime = 60;
    data.technicians[0].efficiency = 1.2;

    const result = planifyLab(data);

    const entry = result.schedule[0];

    expect(entry.duration).toBe(Math.round(60 / 1.2));

    expect(toMinutes(entry.endTime) - toMinutes(entry.startTime)).toBe(
      entry.duration,
    );
  });
});
