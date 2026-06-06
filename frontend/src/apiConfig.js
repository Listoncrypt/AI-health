// Central API configuration — uses VITE_API_URL env var in production, local dev server otherwise
const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname || 'localhost'}:5000`;

export default API_BASE;
