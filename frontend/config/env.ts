export const env = {
  // Keep session cookies and browser API calls on the frontend origin.
  fastifyUrl: "/api/v1",
  fastapiUrl: process.env.NEXT_PUBLIC_FASTAPI_API_URL || "http://localhost:8000/api/v1",
};
