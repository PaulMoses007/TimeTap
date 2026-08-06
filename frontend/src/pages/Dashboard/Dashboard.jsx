import { Container, Typography } from "@mui/material";

function Dashboard() {
  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h3" fontWeight="bold">
        🎉 Welcome to TimeTap Dashboard
      </Typography>

      <Typography sx={{ mt: 2 }}>
        You have successfully logged in.
      </Typography>
    </Container>
  );
}

export default Dashboard;