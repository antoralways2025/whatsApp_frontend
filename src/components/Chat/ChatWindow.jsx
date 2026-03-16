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
  const [recording, setRecording] = useState(false);

  const scrollRef = useRef();
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  /* SOCKET CONNECTION */

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

  /* FETCH CHAT HISTORY */

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

  /* AUTO SCROLL */

  useEffect(() => {

    scrollRef.current?.scrollIntoView({
      behavior: "smooth"
    });

  }, [messages]);

  /* SEND TEXT MESSAGE */

  const sendMessage = async (e) => {

    e.preventDefault();

    if (!text.trim()) return;

    try {

      const { data } = await API.post("/messages", {
        sender: myId,
        receiver: contactId,
        text
      });

      socket.emit("sendMessage", data);

      setMessages((prev) => [...prev, data]);

      setText("");

    } catch (err) {
      console.error(err);
    }

  };

  /* SEND FILE / IMAGE */

  const sendFile = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    const formData = new FormData();

    formData.append("file", file);
    formData.append("sender", myId);
    formData.append("receiver", contactId);

    try {

      const { data } = await API.post("/messages/file", formData);

      socket.emit("sendMessage", data);

      setMessages((prev) => [...prev, data]);

    } catch (err) {
      console.error(err);
    }

  };

  /* START VOICE RECORDING */

  const startRecording = async () => {

    try {

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });

      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {

        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm"
        });

        const formData = new FormData();

        formData.append("audio", blob);
        formData.append("sender", myId);
        formData.append("receiver", contactId);

        const { data } = await API.post("/messages/voice", formData);

        socket.emit("sendMessage", data);

        setMessages((prev) => [...prev, data]);

      };

      mediaRecorder.start();

      setRecording(true);

    } catch (err) {
      console.error(err);
    }

  };

  /* STOP RECORDING */

  const stopRecording = () => {

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    setRecording(false);

  };

  return (

    <div className="flex flex-col h-screen w-full max-w-4xl mx-auto bg-[#111B21] text-white">

      {/* HEADER */}

      <div className="flex items-center justify-between p-3 bg-[#202C33] border-b border-gray-700">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-gray-500"></div>

          <div>
            <div className="font-semibold">Chat</div>
            <div className="text-xs text-gray-400">online</div>
          </div>

        </div>

      </div>

      {/* MESSAGE AREA */}

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-[#0B141A]">

        {messages.map((msg, index) => (

          <div
            key={index}
            ref={scrollRef}
            className={`max-w-xs p-2 rounded-lg mb-2 ${
              msg.sender === myId
                ? "bg-[#005C4B] ml-auto"
                : "bg-[#202C33]"
            }`}
          >

            {msg.text && <div>{msg.text}</div>}

            {/* IMAGE */}

            {msg.file && msg.fileType?.includes("image") && (
              <img
                src={msg.file}
                alt=""
                className="rounded mt-1"
              />
            )}

            {/* FILE */}

            {msg.file && !msg.fileType?.includes("image") && (
              <a
                href={msg.file}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 underline"
              >
                Download File
              </a>
            )}

            {/* VOICE MESSAGE */}

            {msg.audio && (

              <audio controls className="mt-1 w-full">

                <source src={msg.audio} type="audio/webm" />

              </audio>

            )}

          </div>

        ))}

      </div>

      {/* INPUT BAR */}

      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 p-2 sm:p-3 bg-[#202C33]"
      >

        {/* FILE BUTTON */}

        <input
          type="file"
          onChange={sendFile}
          className="text-sm"
        />

        {/* TEXT INPUT */}

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 p-2 rounded bg-[#2A3942] text-white outline-none"
          placeholder="Type a message"
        />

        {/* VOICE BUTTON */}

        {recording ? (

          <button
            type="button"
            onClick={stopRecording}
            className="bg-red-500 px-4 py-2 rounded-full"
          >
            Stop
          </button>

        ) : (

          <button
            type="button"
            onClick={startRecording}
            className="bg-green-500 px-4 py-2 rounded-full"
          >
            🎤
          </button>

        )}

        {/* SEND BUTTON */}

        <button
          type="submit"
          className="bg-green-600 px-4 py-2 rounded"
        >
          Send
        </button>

      </form>

    </div>

  );

}