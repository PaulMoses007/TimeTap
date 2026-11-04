import { Chip } from "@mui/material";

const LABELS = {
  qr: { label: "QR scan", color: "success" },
  button: { label: "Button", color: "info" },
  manual: { label: "Manual", color: "warning" },
};

// Shows how an employee checked in / out
function SourceChip({ source }) {
  if (!source) return <span>-</span>;

  const item = LABELS[source] || { label: source, color: "default" };

  return (
    <Chip
      size="small"
      variant="outlined"
      label={item.label}
      color={item.color}
    />
  );
}

export default SourceChip;
