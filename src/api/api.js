import axios from "axios";

const API = axios.create({
  baseURL: "https://whatsapp-backend-87dn.onrender.com/api",
});

// Attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers["x-auth-token"] = token;
  return req;
});

export default API;