import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import { AuthContext } from "../../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/auth/login", form);
      loginUser(data);
      navigate("/chats");
    } catch (err) {
      alert(err.response.data.msg);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form className="bg-white p-8 rounded shadow-md w-96" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-6">Login</h2>
        <input
          name="email"
          placeholder="Email"
          type="email"
          className="border p-2 w-full mb-4 rounded"
          onChange={handleChange}
        />
        <input
          name="password"
          placeholder="Password"
          type="password"
          className="border p-2 w-full mb-4 rounded"
          onChange={handleChange}
        />
        <button className="bg-blue-500 text-white py-2 px-4 rounded w-full">Login</button>
      </form>
    </div>
  );
}