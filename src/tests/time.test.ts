import { addMinutes, maxTime, toHHMM, toMinutes } from "../utils/time";

describe("time utilities", () => {
  describe("toMinutes", () => {
    it("converts valid HH:MM to minutes", () => {
      expect(toMinutes("00:00")).toBe(0);
      expect(toMinutes("01:05")).toBe(65);
      expect(toMinutes("09:30")).toBe(570);
      expect(toMinutes("23:59")).toBe(1439);
    });

    it("throws on invalid time format", () => {
      expect(() => toMinutes("bad")).toThrow(/Invalid time format/);
      expect(() => toMinutes("24:00")).toThrow(/Invalid time format/);
      expect(() => toMinutes("23:60")).toThrow(/Invalid time format/);
      expect(() => toMinutes("-1:00")).toThrow(/Invalid time format/);
      expect(() => toMinutes("10:-5")).toThrow(/Invalid time format/);
      expect(() => toMinutes("")).toThrow(/Invalid time format/);
    });
  });

  describe("toHHMM", () => {
    it("converts minutes to HH:MM with padding", () => {
      expect(toHHMM(0)).toBe("00:00");
      expect(toHHMM(65)).toBe("01:05");
      expect(toHHMM(570)).toBe("09:30");
      expect(toHHMM(1439)).toBe("23:59");
    });

    it("throws on negative minutes", () => {
      expect(() => toHHMM(-1)).toThrow(/Minutes cannot be negative/);
    });
  });

  describe("addMinutes", () => {
    it("adds minutes to a time string", () => {
      expect(addMinutes("09:00", 30)).toBe("09:30");
      expect(addMinutes("09:15", 45)).toBe("10:00");
    });
  });

  describe("maxTime", () => {
    it("returns the later time", () => {
      expect(maxTime("09:00", "10:00")).toBe("10:00");
      expect(maxTime("18:30", "18:29")).toBe("18:30");
    });

    it("returns timeA when times are equal", () => {
      expect(maxTime("09:00", "09:00")).toBe("09:00");
    });
  });
});
