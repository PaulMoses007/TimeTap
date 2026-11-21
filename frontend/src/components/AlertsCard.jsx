import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";

import { getAlerts } from "../services/dashboardService";

// "Needs your attention": late staff, forgotten check-outs, requests waiting
function AlertsCard() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getAlerts()
      .then((data) => setItems(Array.isArray(data?.items) ? data.items : []))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card
      elevation={0}
      sx={{ mb: 4, border: "1px solid #e4e7eb", borderRadius: 3 }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Needs your attention
        </Typography>

        {loading ? (
          <CircularProgress size={26} />
        ) : failed ? (
          <Typography color="text.secondary">
            Could not load alerts.
          </Typography>
        ) : items.length === 0 ? (
          <Alert severity="success">
            All clear. Nobody is late and nothing is waiting for you.
          </Alert>
        ) : (
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {items.map((item, index) => (
              <Alert
                key={`${item.type}-${item.employee_id || item.link}-${index}`}
                severity={item.severity}
                action={
                  item.link ? (
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => navigate(item.link)}
                    >
                      Open
                    </Button>
                  ) : null
                }
              >
                <strong>{item.title}</strong>
                {item.detail ? ` - ${item.detail}` : ""}
              </Alert>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default AlertsCard;
