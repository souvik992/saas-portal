import { describe, expect, it } from "vitest";
import { addDays, ago, axis, change, csv, heatLevel, hourLabel, label, presetRange, qty, rupees, rupeesShort, share, todayIST } from "./analytics";

describe("analytics helpers", () => {
  it("formats money the Indian way", () => {
    expect(rupees(48230000)).toBe("₹4,82,300");
    expect(rupees(37550)).toBe("₹376");
    expect(rupees(4550)).toBe("₹45.50");
    expect(rupees(-120000)).toBe("-₹1,200");
    expect([rupeesShort(95000), rupeesShort(1250000), rupeesShort(48230000), rupeesShort(1200000000)]).toEqual(["₹950", "₹12.5K", "₹4.8L", "₹1.2Cr"]);
    expect(qty(1500)).toBe("1.5");
  });

  it("compares with the earlier period only when there is one", () => {
    expect(change(112, 100)).toBe(12);
    expect(change(90, 100)).toBe(-10);
    expect(change(50, 0)).toBeNull();
    expect([share(1, 3), share(1, 0)]).toEqual([33, 0]);
  });

  it("works out date ranges from India's date", () => {
    expect(todayIST(Date.parse("2026-11-13T20:00:00Z"))).toBe("2026-11-14"); // 1:30 am in India
    expect(presetRange("7d", "2026-11-14")).toEqual({ from: "2026-11-08", to: "2026-11-14" });
    expect(presetRange("30d", "2026-11-14")).toEqual({ from: "2026-10-16", to: "2026-11-14" });
    expect(presetRange("month", "2026-11-14")).toEqual({ from: "2026-11-01", to: "2026-11-14" });
    expect(presetRange("last-month", "2026-03-10")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
    expect(presetRange("yesterday", "2026-03-01")).toEqual({ from: "2026-02-28", to: "2026-02-28" });
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("gives charts round axes and heat shades", () => {
    expect(axis(8730)).toEqual({ max: 10000, ticks: [0, 2500, 5000, 7500, 10000] });
    expect(axis(3)).toEqual({ max: 4, ticks: [0, 1, 2, 3, 4] });
    expect(axis(0).max).toBe(4);
    expect([heatLevel(0, 10), heatLevel(1, 10), heatLevel(5, 10), heatLevel(10, 10)]).toEqual([0, 1, 3, 5]);
    expect([hourLabel(0), hourLabel(9), hourLabel(12), hourLabel(21)]).toEqual(["12am", "9am", "12pm", "9pm"]);
  });

  it("names things plainly", () => {
    expect([label("dine_in"), label(""), label("upi"), label("paytm")]).toEqual(["Dine-in", "Not recorded", "UPI", "Paytm"]);
    expect(ago(1000, 1000 + 5 * 60_000)).toBe("5 minutes ago");
    expect(ago(0, 3 * 86_400_000)).toBe("3 days ago");
    expect(csv([["Date", "Sales"], ["2026-11-01", 1200], ['Paneer, "special"', 5]])).toBe('Date,Sales\r\n2026-11-01,1200\r\n"Paneer, ""special""",5');
  });
});
