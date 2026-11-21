import { useEffect, useState } from "react";

import { Box, Card, CardContent, CircularProgress, Typography } from "@mui/material";

import { getMyShifts } from "../services/rosterService";

const dayText = (isoDate) =>
  new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });

// Employee: the shifts the manager has planned for the next two weeks
function MyShiftsCard() {
  const [shifts, setShifts] = useState(null);

  useEffect(() => {
    getMyShifts(14)
      .then((data) => setShifts(Array.isArray(data) ? data : []))
      .catch(() => setShifts([]));
  }, []);

  return (
    <Card sx={{ mb: 4, borderRadius: 3 }} elevation={0}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          My next shifts
        </Typography>

        {shifts === null ? (
          <CircularProgress size={28} />
        ) : shifts.length === 0 ? (
          <Typography color="text.secondary">
            No shifts planned for the next two weeks.
          </Typography>
        ) : (
          <Box sx={{ display: "grid", gap: 1 }}>
            {shifts.map((shift) => (
              <Box
                key={shift.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                  p: 1.5,
                  border: "1px solid #e4e7eb",
                  borderRadius: 2,
                }}
              >
                <Typography fontWeight="500">{dayText(shift.work_date)}</Typography>
                <Typography>
                  {shift.start_time} - {shift.end_time}
                  {shift.note ? ` (${shift.note})` : ""}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default MyShiftsCard;
