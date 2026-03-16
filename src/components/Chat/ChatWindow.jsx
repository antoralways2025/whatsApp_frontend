import { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import { socket } from "../../socket";

export default function ChatWindow() {
  const { user } = useContext(AuthContext);
  const { contactId } = useParams();
  const myId = user?.user?._id;
  const myName = user?.user?.name;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef();

  // join room and socket events
  useEffect(() => {
    if (!myId) return;
    socket.emit("joinRoom", myId);

    socket.on("receiveMessage", (msg) => {
      if (msg.sender === contactId || msg.receiver === contactId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("typing", () => setTyping(true));
    socket.on("stopTyping", () => setTyping(false));

    return () => {
      socket.off("receiveMessage");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [myId, contactId]);

  // fetch messages from backend
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await API.get(
          `/messages?userId=${myId}&contactId=${contactId}`
        );
        setMessages(data);
      } catch (err) {
        console.error(err);
      }
    };
    if (contactId) fetchMessages();
  }, [contactId, myId]);

  // scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTyping = (e) => {
    setText(e.target.value);
    socket.emit("typing", { sender: myId, receiver: contactId });
    setTimeout(() => {
      socket.emit("stopTyping", { sender: myId, receiver: contactId });
    }, 1000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const messageData = { sender: myId, receiver: contactId, text };

    try {
      const { data } = await API.post("/messages", messageData);
      socket.emit("sendMessage", data);
      setMessages((prev) => [...prev, data]);
      setText("");
    } catch (err) {
      console.error(err);
    }
  };

  const startVideoCall = () => socket.emit("callUser", { from: myId, to: contactId });
  const startAudioCall = () => socket.emit("callUser", { from: myId, to: contactId, type: "audio" });

  return (
    <div className="flex flex-col h-screen text-white">
      {/* HEADER */}
      <div className="flex justify-between items-center p-3 bg-[#202C33] border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-500"></div>
          <div>
            <div className="font-semibold">Chat with {myName}</div>
            <div className="text-xs text-gray-400">online</div>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={startAudioCall} className="text-gray-300 hover:text-white text-xl">🎤</button>
          <button onClick={startVideoCall} className="text-gray-300 hover:text-white text-xl">📹</button>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-[#0B141A]">
        {messages.map((msg, index) => (
          <div
            key={index}
            ref={scrollRef}
            className={`max-w-xs p-2 rounded-lg mb-2 ${msg.sender === myId ? "bg-[#005C4B] self-end" : "bg-[#202C33] self-start"}`}
          >
            {msg.text}
          </div>
        ))}
        {typing && <div className="text-sm text-gray-400">typing...</div>}
      </div>

      {/* INPUT */}
      <form onSubmit={handleSend} className="flex items-center gap-2 p-3 bg-[#202C33]">
        <input type="text" value={text} onChange={handleTyping} placeholder="Type a message"
          className="flex-1 p-2 rounded bg-[#2A3942] text-white outline-none" />
        <button type="submit" className="bg-green-500 px-4 py-2 rounded">Send</button>
      </form>
    </div>
  );
}