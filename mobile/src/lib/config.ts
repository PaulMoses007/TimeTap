// One place for the backend address.
// To point the app at another backend (without editing code), build with
//   EXPO_PUBLIC_API_URL=https://your-backend.example.com
// otherwise the production Render backend is used.
export const API_BASE_URL: string = (
  process.env.EXPO_PUBLIC_API_URL || 'https://timetap-backend.onrender.com'
).replace(/\/+$/, '');
