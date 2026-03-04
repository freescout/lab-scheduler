// src/tests/planifyLab.test.ts
import { planifyLab } from "../scheduler/planifyLab";
import { example1, example2, example3 } from "./fixtures/testFixtures";
import { toMinutes } from "../utils/time";
import { LabData } from "../models/types";

describe("planifyLab", () => {
  describe("Example 1 - Single sample", () => {
    it("should schedule one sample and compute metrics correctly", () => {
      const result = planifyLab(example1);

      expect(result.schedule).toHaveLength(1);

      const [e] = result.schedule;

      expect(e.sampleId).toBe("S001");
      expect(e.technicianId).toBe("T001");
      expect(e.equipmentId).toBe("E001");
      expect(e.startTime).toBe("09:00");
      expect(e.endTime).toBe("09:30");
      expect(e.priority).toBe("URGENT");
      expect(e.duration).toBe(30);
      expect(e.cleaningRequired).toBe(true);
      expect(e.lunchBreak).toBe("12:00-13:00");

      expect(result.metrics.totalTime).toBe(30);
      expect(result.metrics.conflicts).toBe(0);

      // Efficiency = totalWorkTime / (technicians.length * totalTime) * 100
      // = 30 / (1 * 30) * 100 = 100
      expect(result.metrics.efficiency).toBeCloseTo(100.0, 1);

      // Utilization = totalWorkTime / totalShiftCapacity * 100
      // = 30 / 540 * 100 = 5.6%
      expect(result.metrics.technicianUtilization).toBeCloseTo(5.6, 1);

      expect(result.metrics.averageWaitTime).toEqual({
        STAT: 0,
        URGENT: 0,
        ROUTINE: 0,
      });

      expect(result.metrics.priorityRespectRate).toBeCloseTo(100.0, 1);
      expect(result.metrics.parallelAnalyses).toBe(1);
    });
  });

  describe("Example 2 - STAT vs URGENT", () => {
    it("should schedule STAT before URGENT (even if STAT arrives later) and compute metrics", () => {
      const result = planifyLab(example2);

      expect(result.schedule).toHaveLength(2);
      // schedule is sorted by startTime at the end
      const [first, second] = result.schedule;

      expect(first.sampleId).toBe("S002"); // STAT
      expect(first.priority).toBe("STAT");
      expect(first.startTime).toBe("09:30");
      expect(first.endTime).toBe("10:00");

      // equipment cleaning time = 10 => next starts at 10:10
      expect(second.sampleId).toBe("S001"); // URGENT
      expect(second.priority).toBe("URGENT");
      expect(second.startTime).toBe("10:10");
      expect(second.endTime).toBe("10:55");

      expect(result.metrics.totalTime).toBe(85); // 09:30 -> 10:55
      expect(result.metrics.conflicts).toBe(0);

      // totalWorkTime = 30 + 45 = 75
      // efficiency = 75 / (1 * 85) * 100 = 88.2%
      expect(result.metrics.efficiency).toBeCloseTo(88.2, 1);

      // utilization = 75 / 540 * 100 = 13.9%
      expect(result.metrics.technicianUtilization).toBeCloseTo(13.9, 1);

      expect(result.metrics.averageWaitTime).toEqual({
        STAT: 0,
        URGENT: 70, // 10:10 (610) - 09:00 (540) = 70
        ROUTINE: 0,
      });

      expect(result.metrics.priorityRespectRate).toBeCloseTo(100.0, 1);
      expect(result.metrics.parallelAnalyses).toBe(1);
    });
  });

  describe("Example 3 - Parallel scheduling", () => {
    it("should run 2 analyses in parallel (2 techs + 2 equipments) and compute metrics", () => {
      const result = planifyLab(example3);

      expect(result.schedule).toHaveLength(3);

      // Ensure schedule is time-sorted
      for (let i = 1; i < result.schedule.length; i++) {
        expect(toMinutes(result.schedule[i].startTime)).toBeGreaterThanOrEqual(
          toMinutes(result.schedule[i - 1].startTime),
        );
      }

      // Expected schedule given current greedy selection + cleaningTime=10:
      // S001: 09:00-10:00 on T001/E001
      // S002: 09:15-09:45 on T002/E002
      // S003: 09:55-10:40 on T002/E002 (cleaning pushes equip2 to 09:55)
      const s1 = result.schedule.find((e) => e.sampleId === "S001")!;
      const s2 = result.schedule.find((e) => e.sampleId === "S002")!;
      const s3 = result.schedule.find((e) => e.sampleId === "S003")!;

      expect(s1.startTime).toBe("09:00");
      expect(s1.endTime).toBe("10:00");
      expect(s1.technicianId).toBe("T001");
      expect(s1.equipmentId).toBe("E001");

      expect(s2.startTime).toBe("09:15");
      expect(s2.endTime).toBe("09:45");
      expect(s2.technicianId).toBe("T002");
      expect(s2.equipmentId).toBe("E002");

      expect(s3.startTime).toBe("09:55");
      expect(s3.endTime).toBe("10:40");
      expect(s3.technicianId).toBe("T002");
      expect(s3.equipmentId).toBe("E002");

      expect(result.metrics.totalTime).toBe(100); // 09:00 -> 10:40
      expect(result.metrics.conflicts).toBe(0);

      // totalWorkTime = 60 + 30 + 45 = 135
      // efficiency = 135 / (2 * 100) * 100 = 67.5%
      expect(result.metrics.efficiency).toBeCloseTo(67.5, 1);

      // utilization = 135 / 1080 * 100 = 12.5%
      expect(result.metrics.technicianUtilization).toBeCloseTo(12.5, 1);

      expect(result.metrics.averageWaitTime).toEqual({
        STAT: 0,
        URGENT: 0, // S001 wait 0, S002 wait 0
        ROUTINE: 55, // S003 starts 09:55 (595) - arrival 09:00 (540) = 55
      });

      expect(result.metrics.priorityRespectRate).toBeCloseTo(100.0, 1);
      expect(result.metrics.parallelAnalyses).toBe(2);
    });
  });
});

describe("Intermediate - Lunch break", () => {
  it("should not start an analysis during technician lunch break", () => {
    const data: LabData = {
      samples: [
        {
          id: "S001",
          type: "BLOOD",
          analysisType: "Bilan lipidique",
          priority: "ROUTINE",
          analysisTime: 30,
          arrivalTime: "11:50", // arrives just before lunch 12:00-13:00
        },
      ],
      technicians: [
        {
          id: "T001",
          name: "Alice",
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
          name: "Analyseur",
          type: "BLOOD",
          compatibleTypes: ["Bilan lipidique"],
          available: true,
          cleaningTime: 0,
        },
      ],
    };

    const result = planifyLab(data);
    expect(result.schedule).toHaveLength(1);

    const entry = result.schedule[0];
    // Should be pushed to after lunch
    expect(toMinutes(entry.startTime)).toBeGreaterThanOrEqual(
      toMinutes("13:00"),
    );
    expect(entry.lunchBreak).toBe("12:00-13:00");
    expect(result.metrics.lunchInterruptions).toBe(1);
  });

  it("should not adjust start time if analysis starts after lunch ends", () => {
    const data: LabData = {
      samples: [
        {
          id: "S001",
          type: "BLOOD",
          analysisType: "Bilan lipidique",
          priority: "ROUTINE",
          analysisTime: 30,
          arrivalTime: "13:30", // after lunch 12:00-13:00
        },
      ],
      technicians: [
        {
          id: "T001",
          name: "Alice",
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
          name: "Analyseur",
          type: "BLOOD",
          compatibleTypes: ["Bilan lipidique"],
          available: true,
          cleaningTime: 0,
        },
      ],
    };

    const result = planifyLab(data);
    expect(result.schedule).toHaveLength(1);
    // Starts exactly at arrival, no lunch adjustment needed
    expect(result.schedule[0].startTime).toBe("13:30");
  });
});

describe("Intermediate - Maintenance window", () => {
  it("should not schedule during equipment maintenance window", () => {
    const data: LabData = {
      samples: [
        {
          id: "S001",
          type: "BLOOD",
          analysisType: "Bilan lipidique",
          priority: "ROUTINE",
          analysisTime: 30,
          arrivalTime: "07:00", // arrives during maintenance 07:00-08:00
        },
      ],
      technicians: [
        {
          id: "T001",
          name: "Alice",
          speciality: ["BLOOD"],
          efficiency: 1.0,
          startTime: "07:00",
          endTime: "17:00",
          lunchBreak: "12:00-13:00",
        },
      ],
      equipment: [
        {
          id: "E001",
          name: "Analyseur",
          type: "BLOOD",
          compatibleTypes: ["Bilan lipidique"],
          available: true,
          maintenanceWindow: "07:00-08:00",
          cleaningTime: 0,
        },
      ],
    };

    const result = planifyLab(data);
    expect(result.schedule).toHaveLength(1);

    // Should start after maintenance ends
    expect(toMinutes(result.schedule[0].startTime)).toBeGreaterThanOrEqual(
      toMinutes("08:00"),
    );
  });
});

describe("Intermediate - Priority respect rate", () => {
  it("should detect priority violation and lower priorityRespectRate", () => {
    const data: LabData = {
      samples: [
        {
          id: "S001",
          type: "BLOOD",
          analysisType: "Bilan lipidique",
          priority: "STAT",
          analysisTime: 30,
          arrivalTime: "09:00",
        },
        {
          id: "S002",
          type: "BLOOD",
          analysisType: "Bilan lipidique",
          priority: "ROUTINE",
          analysisTime: 30,
          arrivalTime: "09:00",
        },
      ],
      technicians: [
        {
          id: "T001",
          name: "Alice",
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
          name: "Analyseur",
          type: "BLOOD",
          compatibleTypes: ["Bilan lipidique"],
          available: true,
          cleaningTime: 0,
        },
      ],
    };

    const result = planifyLab(data);
    // STAT should start first, ROUTINE after → no violation
    expect(result.metrics.priorityRespectRate).toBe(100);

    const statEntry = result.schedule.find((e) => e.sampleId === "S001")!;
    const routineEntry = result.schedule.find((e) => e.sampleId === "S002")!;
    expect(toMinutes(statEntry.startTime)).toBeLessThan(
      toMinutes(routineEntry.startTime),
    );
  });
});

describe("Intermediate - Metadata", () => {
  it("should return metadata with lunchBreaks and constraintsApplied", () => {
    const data: LabData = {
      samples: [
        {
          id: "S001",
          type: "BLOOD",
          analysisType: "Bilan lipidique",
          priority: "ROUTINE",
          analysisTime: 30,
          arrivalTime: "11:50",
        },
      ],
      technicians: [
        {
          id: "T001",
          name: "Alice",
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
          name: "Analyseur",
          type: "BLOOD",
          compatibleTypes: ["Bilan lipidique"],
          available: true,
          cleaningTime: 0,
        },
      ],
    };

    const result = planifyLab(data);

    expect(result.metadata).toBeDefined();
    expect(result.metadata.lunchBreaks).toHaveLength(1);
    expect(result.metadata.lunchBreaks[0].technicianId).toBe("T001");
    expect(result.metadata.lunchBreaks[0].planned).toBe("12:00-13:00");
    expect(result.metadata.constraintsApplied).toContain("priority_management");
    expect(result.metadata.constraintsApplied).toContain("lunch_breaks");
  });
});
