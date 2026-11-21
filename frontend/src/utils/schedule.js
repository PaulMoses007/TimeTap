/** Helpers for the work schedule form fields. */
export function validateSchedule(value) {
  if (value.schedule_type !== "Fixed") {
    return "";
  }

  if (!value.shift_start || !value.shift_end) {
    return "Enter both shift start and shift end times for a fixed schedule.";
  }

  if (value.shift_start >= value.shift_end) {
    return "Shift end time must be later than shift start time.";
  }

  return "";
}

export function scheduleForRequest(value) {
  if (value.schedule_type === "Fixed") {
    return {
      schedule_type: "Fixed",
      shift_start: value.shift_start,
      shift_end: value.shift_end,
    };
  }

  return { schedule_type: "Flexible", shift_start: null, shift_end: null };
}
