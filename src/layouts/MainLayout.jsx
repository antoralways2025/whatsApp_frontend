import { useParams } from "react-router-dom";
import ChatList from "../components/Chat/ChatList";
import ChatWindow from "../components/Chat/ChatWindow";

export default function MainLayout() {

  const { contactId } = useParams();

  return (

    <div className="h-screen flex bg-[#111B21] text-white">

      {/* LEFT SIDEBAR */}

      <div className="w-[30%] border-r border-gray-700 bg-[#202C33]">

        <ChatList />

      </div>

      {/* RIGHT CHAT AREA */}

      <div className="flex-1 bg-[#0B141A]">

        {contactId ? (
          <ChatWindow />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a chat to start messaging
          </div>
        )}

      </div>

    </div>

  );

}