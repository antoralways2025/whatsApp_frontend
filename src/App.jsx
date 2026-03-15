import { useContext } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";

import { AuthContext } from "./context/AuthContext";

import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import CallPopup from "./components/Call/CallPopup";
import VideoCall from "./components/Call/VideoCall";
import MainLayout from "./layouts/MainLayout";

function App() {

  const { user } = useContext(AuthContext);

  const userId = user?.user?._id;

  return (

    <Router>

      {userId && <CallPopup userId={userId} />}

      <Routes>

        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/chats" />}
        />

        <Route
          path="/signup"
          element={!user ? <Signup /> : <Navigate to="/chats" />}
        />

        {/* WHATSAPP STYLE LAYOUT */}

        <Route
          path="/chats"
          element={user ? <MainLayout /> : <Navigate to="/login" />}
        />

        <Route
          path="/chats/:contactId"
          element={user ? <MainLayout /> : <Navigate to="/login" />}
        />

        <Route
          path="/call/:contactId"
          element={user ? <VideoCall /> : <Navigate to="/login" />}
        />

        <Route
          path="/"
          element={user ? <Navigate to="/chats" /> : <Navigate to="/login" />}
        />

      </Routes>

    </Router>

  );

}

export default App;