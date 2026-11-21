import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

/**
 * Work schedule picker: Flexible, or Fixed with a shift start and end.
 * `value` is { schedule_type, shift_start, shift_end }.
 */
function ScheduleFields({ value, onChange }) {
  const isFixed = value.schedule_type === "Fixed";

  const handleType = (event) => {
    const type = event.target.value;

    onChange({
      schedule_type: type,
      shift_start: type === "Fixed" ? value.shift_start || "09:00" : "",
      shift_end: type === "Fixed" ? value.shift_end || "17:00" : "",
    });
  };

  return (
    <>
      <FormControl fullWidth margin="normal">
        <InputLabel>Work schedule</InputLabel>

        <Select
          label="Work schedule"
          name="schedule_type"
          value={value.schedule_type || "Flexible"}
          onChange={handleType}
        >
          <MenuItem value="Flexible">Flexible (no fixed hours)</MenuItem>
          <MenuItem value="Fixed">Fixed shift</MenuItem>
        </Select>
      </FormControl>

      {isFixed && (
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            fullWidth
            required
            type="time"
            label="Shift start"
            value={value.shift_start || ""}
            onChange={(event) =>
              onChange({ ...value, shift_start: event.target.value })
            }
            margin="normal"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            fullWidth
            required
            type="time"
            label="Shift end"
            value={value.shift_end || ""}
            onChange={(event) =>
              onChange({ ...value, shift_end: event.target.value })
            }
            margin="normal"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
      )}
    </>
  );
}

export default ScheduleFields;
