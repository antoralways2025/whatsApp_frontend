import { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import { socket } from "../../socket";

export default function ChatWindow() {

  const { user } = useContext(AuthContext);
  const { contactId } = useParams();

  const myId = user?.user?._id;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const fileRef = useRef();
  const scrollRef = useRef();

  useEffect(() => {

    if (!myId) return;

    socket.emit("joinRoom", myId);

    socket.on("receiveMessage", (msg) => {

      if (
        msg.sender === contactId ||
        msg.receiver === contactId
      ) {
        setMessages((prev) => [...prev, msg]);
      }

    });

    return () => {
      socket.off("receiveMessage");
    };

  }, [myId, contactId]);

  useEffect(() => {

    const fetchMessages = async () => {

      const { data } = await API.get(
        `/messages?userId=${myId}&contactId=${contactId}`
      );

      setMessages(data);

    };

    if (contactId) fetchMessages();

  }, [contactId, myId]);

  useEffect(() => {

    scrollRef.current?.scrollIntoView({
      behavior: "smooth"
    });

  }, [messages]);

  const sendMessage = async (e) => {

    e.preventDefault();

    if (!text.trim()) return;

    const { data } = await API.post("/messages", {
      sender: myId,
      receiver: contactId,
      text
    });

    socket.emit("sendMessage", data);

    setMessages((prev) => [...prev, data]);

    setText("");

  };

  const sendFile = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    const formData = new FormData();

    formData.append("file", file);
    formData.append("sender", myId);
    formData.append("receiver", contactId);

    const { data } = await API.post("/messages/file", formData);

    socket.emit("sendMessage", data);

    setMessages((prev) => [...prev, data]);

  };

  return (

    <div className="flex flex-col h-screen text-white">

      {/* MESSAGE AREA */}

      <div className="flex-1 overflow-y-auto p-4 bg-[#0B141A]">

        {messages.map((msg, i) => (

          <div
            key={i}
            ref={scrollRef}
            className={`max-w-xs p-2 rounded-lg mb-2 ${
              msg.sender === myId
                ? "bg-[#005C4B] ml-auto"
                : "bg-[#202C33]"
            }`}
          >

            {msg.text && <div>{msg.text}</div>}

            {msg.file && msg.fileType.includes("image") && (
              <img
                src={msg.file}
                alt=""
                className="rounded mt-1"
              />
            )}

            {msg.file && !msg.fileType.includes("image") && (
              <a
                href={msg.file}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 underline"
              >
                Download File
              </a>
            )}

          </div>

        ))}

      </div>

      {/* INPUT */}

      <form
        onSubmit={sendMessage}
        className="flex gap-2 p-3 bg-[#202C33]"
      >

        <input
          type="file"
          ref={fileRef}
          onChange={sendFile}
        />

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 p-2 rounded bg-[#2A3942]"
          placeholder="Type message"
        />

        <button className="bg-green-500 px-4 rounded">
          Send
        </button>

      </form>

    </div>

  );

}