// Centralized API base URL
// In development: reads from .env (http://localhost:5000)
// In production build: reads from .env.production (empty string = same origin)
const API_BASE = import.meta.env.VITE_API_URL || '';

export default API_BASE;
