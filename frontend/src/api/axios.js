import axios from "axios";

const api = axios.create({
  baseURL: "https://fuzzy-space-tribble-974vrjrxrxp9pfxjq4-8001.app.github.dev",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;