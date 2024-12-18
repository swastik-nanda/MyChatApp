import { useEffect, useState, useRef, useContext } from "react";
import { UserContext } from "./contexts/UserContext";
import Avatar from "./Avatar";
import Logo from "./Logo";

export default function Chat() {
  const [message, setMessage] = useState("");
  const wsConnection = useRef(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { id } = useContext(UserContext);

  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  }

  useEffect(() => {
    wsConnection.current = new WebSocket("ws://localhost:4000");

    const handleMessage = (ev) => {
      const messageData = JSON.parse(ev.data);
      if ("online" in messageData) {
        showOnlinePeople(messageData.online);
      }
    };

    wsConnection.current.addEventListener("message", handleMessage);

    return () => {
      wsConnection.current.removeEventListener("message", handleMessage);
      wsConnection.current.close();
    };
  }, []);

  const handleSendMessage = () => {
    if (wsConnection.current && message) {
      wsConnection.current.send(message);
      setMessage("");
    }
  };

  const onlinePeopleExcludingUser = { ...onlinePeople };
  delete onlinePeopleExcludingUser[id];

  return (
    <div className="flex h-screen">
      <div className="bg-blue-100 w-1/3">
        <Logo></Logo>
        {Object.keys(onlinePeopleExcludingUser).map((userId, index) => (
          <div
            onClick={() => setSelectedUserId(userId)}
            className={
              "border-b border-gray-100 flex gap-2 items-center cursor-pointer " +
              (userId === selectedUserId ? "bg-blue-200" : "")
            }
            key={index}
          >
            {userId === selectedUserId && (
              <div className="w-1 h-12 bg-blue-600 rounded-r-md"></div>
            )}
            <div className="py-2 pl-4 flex gap-2 items-center">
              <Avatar username={onlinePeople[userId]} userId={userId}></Avatar>
              <span className="text-md text-gray-800">
                {onlinePeople[userId]}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-blue-300 w-2/3 p-2 flex flex-col">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex h-full items-center justify-center">
              <div className="text-gray-800 text-2xl font-bold">
                &larr;Select a contact to start a chat with
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-white border p-4 flex-grow rounded-full"
            placeholder="Type your message here"
          />
          <button
            className="bg-blue-500 p-4 text-white rounded-full"
            onClick={handleSendMessage}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
