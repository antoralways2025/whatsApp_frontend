import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

let socket;

export default function CallPopup({userId}){

  const [incoming,setIncoming] = useState(null);

  const navigate = useNavigate();

  const ringtone = new Audio("/ringtone.mp3");

  useEffect(()=>{

    socket = io("https://whatsapp-backend-87dn.onrender.com/");

    socket.emit("joinRoom",userId);

    socket.on("incomingCall",({from})=>{

      setIncoming(from);

      ringtone.loop = true;
      ringtone.play();

    });

  },[userId]);

  const acceptCall = ()=>{

    ringtone.pause();

    socket.emit("acceptCall",{
      from:userId,
      to:incoming
    });

    navigate(`/call/${incoming}`);

  };

  const rejectCall = ()=>{

    ringtone.pause();

    socket.emit("rejectCall",{
      to:incoming
    });

    setIncoming(null);

  };

  if(!incoming) return null;

  return(

    <div className="fixed bottom-10 right-10 bg-white shadow-lg p-5 rounded">

      <p className="mb-3 font-semibold">
        Incoming Call...
      </p>

      <div className="flex gap-3">

        <button
        onClick={acceptCall}
        className="bg-green-500 text-white px-4 py-2 rounded">
          Accept
        </button>

        <button
        onClick={rejectCall}
        className="bg-red-500 text-white px-4 py-2 rounded">
          Reject
        </button>

      </div>

    </div>

  );
}
