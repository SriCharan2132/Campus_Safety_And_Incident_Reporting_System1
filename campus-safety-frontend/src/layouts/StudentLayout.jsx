import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import ChatBotWidget from "../components/ChatBot/ChatBotWidget";
function StudentLayout() {
  return (
    <div className="h-dvh flex bg-gray-100">

      {/* SIDEBAR */}
      <Sidebar />

      {/* RIGHT SIDE */}
      <div className="flex flex-1 flex-col min-h-0">

        {/* NAVBAR (STICKY) */}
        <div className="sticky top-0 z-40 shrink-0">
          <Navbar />
        </div>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <Outlet />
        </main>

      </div>
      <ChatBotWidget />
    </div>
  );
}

export default StudentLayout;