import { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Peer from "simple-peer";
import { io } from "socket.io-client";
import { AuthContext } from "../../context/AuthContext";

let socket;

export default function VideoCall() {

  const { user } = useContext(AuthContext);
  const { contactId } = useParams();

  const myId = user?.user?._id;

  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [callerSignal, setCallerSignal] = useState();
  const [caller, setCaller] = useState("");
  const [callAccepted, setCallAccepted] = useState(false);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {

    socket = io("http://localhost:5000");

    socket.emit("joinRoom", myId);

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {

        setStream(currentStream);
        myVideo.current.srcObject = currentStream;

      });

    socket.on("incomingCall", ({ from, signal }) => {

      setReceivingCall(true);
      setCaller(from);
      setCallerSignal(signal);

    });

  }, [myId]);

  const callUser = () => {

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {

      socket.emit("callUser", {
        userToCall: contactId,
        signalData: data,
        from: myId,
      });

    });

    peer.on("stream", (currentStream) => {

      userVideo.current.srcObject = currentStream;

    });

    socket.on("callAccepted", (signal) => {

      setCallAccepted(true);
      peer.signal(signal);

    });

    connectionRef.current = peer;

  };

  const answerCall = () => {

    setCallAccepted(true);

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {

      socket.emit("answerCall", {
        signal: data,
        to: caller,
      });

    });

    peer.on("stream", (currentStream) => {

      userVideo.current.srcObject = currentStream;

    });

    peer.signal(callerSignal);

    connectionRef.current = peer;

  };

  return (

    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">

      <div className="flex gap-5">

        <video
          playsInline
          muted
          ref={myVideo}
          autoPlay
          className="w-64 bg-black"
        />

        {callAccepted && (
          <video
            playsInline
            ref={userVideo}
            autoPlay
            className="w-64 bg-black"
          />
        )}

      </div>

      <div className="mt-5">

        {receivingCall && !callAccepted && (

          <button
            onClick={answerCall}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Answer Call
          </button>

        )}

        {!callAccepted && (

          <button
            onClick={callUser}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Start Call
          </button>

        )}

      </div>

    </div>

  );
}
