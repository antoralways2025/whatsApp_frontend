import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../../api/api";
import { AuthContext } from "../../context/AuthContext";

let socket;

export default function ChatList() {

  const { user, logoutUser } = useContext(AuthContext);

  const navigate = useNavigate();

  const myId = user?.user?._id;

  const [contacts, setContacts] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [unread, setUnread] = useState({});

  useEffect(() => {

    if (!myId) return;

    socket = io("https://whatsapp-backend-87dn.onrender.com");

    socket.emit("joinRoom", myId);

    socket.on("receiveMessage", (msg) => {

      setLastMessages((prev) => ({
        ...prev,
        [msg.sender]: msg.text
      }));

      setUnread((prev) => ({
        ...prev,
        [msg.sender]: (prev[msg.sender] || 0) + 1
      }));

    });

    socket.on("updateUserStatus", (onlineUsers) => {

      setContacts((prev) =>
        prev.map((c) => ({
          ...c,
          online: onlineUsers.some((u) => u._id === c._id)
        }))
      );

    });

    return () => socket.disconnect();

  }, [myId]);

  useEffect(() => {

    const fetchUsers = async () => {

      try {

        const { data } = await API.get("/users");

        const filtered = data
          .filter((u) => u._id !== myId)
          .map((u) => ({
            ...u,
            online: false
          }));

        setContacts(filtered);

      } catch (err) {
        console.error(err);
      }

    };

    fetchUsers();

  }, [myId]);

  const openChat = (id) => {

    setUnread((prev) => ({
      ...prev,
      [id]: 0
    }));

    navigate(`/chats/${id}`);

  };

  const handleLogout = () => {

    logoutUser();

    navigate("/login");

  };

  return (

    <div className="h-screen flex flex-col bg-[#202C33] text-white">

      {/* HEADER */}

      <div className="flex justify-between items-center p-4 border-b border-gray-700">

        <h2 className="text-lg font-semibold">
          WhatsApp
        </h2>

        <button
          onClick={handleLogout}
          className="text-sm bg-red-500 px-3 py-1 rounded"
        >
          Logout
        </button>

      </div>

      {/* CHAT LIST */}

      <div className="flex-1 overflow-y-auto">

        {contacts.map((c) => (

          <div
            key={c._id}
            onClick={() => openChat(c._id)}
            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#2A3942]"
          >

            {/* AVATAR */}

            <div className="relative">

              <div className="w-10 h-10 rounded-full bg-gray-500"></div>

              {c.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-[#202C33]"></div>
              )}

            </div>

            {/* NAME + MESSAGE */}

            <div className="flex-1">

              <div className="font-medium">
                {c.name}
              </div>

              <div className="text-sm text-gray-400 truncate">
                {lastMessages[c._id] || "Start chatting"}
              </div>

            </div>

            {/* UNREAD BADGE */}

            {unread[c._id] > 0 && (

              <div className="bg-green-500 text-xs px-2 py-1 rounded-full">
                {unread[c._id]}
              </div>

            )}

          </div>

        ))}

      </div>

    </div>

  );

}