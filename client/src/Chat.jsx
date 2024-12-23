import { useEffect, useState, useRef, useContext } from "react";
import { UserContext } from "./contexts/UserContext";
import { uniqBy } from "lodash";
import Logo from "./Logo";
import axios from "axios";
import Contact from "./Contact";
import LogoutButton from "./LogoutButton";
import SendButton from "./SendButton";
import UserDetailLogo from "./UserDetailLogo";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [textMessages, setTextMessages] = useState([]);
  const wsConnection = useRef(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [offlinePeople, setOfflinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { username, id, setId, setUsername } = useContext(UserContext);
  const divUnderMessages = useRef();
  const prevOnlinePeopleRef = useRef(onlinePeople); // For comparison

  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });

    setOnlinePeople((prev) => {
      const hasChanged = JSON.stringify(prev) !== JSON.stringify(people);
      return hasChanged ? people : prev;
    });

    // Remove online users from offlinePeople
    setOfflinePeople((prevOfflinePeople) => {
      const updatedOfflinePeople = { ...prevOfflinePeople };
      peopleArray.forEach(({ userId }) => {
        delete updatedOfflinePeople[userId];
      });
      return updatedOfflinePeople;
    });
  }

  function connectToWs() {
    wsConnection.current = new WebSocket("ws://localhost:4000");

    const handleMessage = (ev) => {
      try {
        const messageData = JSON.parse(ev.data);
        if ("online" in messageData) {
          showOnlinePeople(messageData.online);
        } else if ("text" in messageData) {
          setTextMessages((t) => [...t, { ...messageData }]);
        }
      } catch (err) {
        console.error("Failed to parse message:", err);
      }
    };

    wsConnection.current.addEventListener("message", handleMessage);
    wsConnection.current.addEventListener("close", () => {
      setTimeout(() => {
        console.log("Disconnected. Trying to reconnect.");
        connectToWs();
      }, 1000);
    });
  }

  useEffect(() => {
    connectToWs();
  }, []);

  function handleSendMessage(ev) {
    ev.preventDefault();
    if (wsConnection.current && selectedUserId && message) {
      wsConnection.current.send(
        JSON.stringify({
          recipient: selectedUserId,
          text: message,
        })
      );
      setMessage("");
      setTextMessages((t) => [
        ...t,
        {
          text: message,
          sender: id,
          recipient: selectedUserId,
          _id: Date.now(),
        },
      ]);
    }
  }

  function logout() {
    axios.post("/logout").then(() => {
      setId(null);
      setUsername(null);
    });
  }

  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) {
      div.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [textMessages]);

  useEffect(() => {
    const renderOfflineUsers = async () => {
      if (
        !onlinePeople ||
        Object.keys(onlinePeople).length === 0 ||
        JSON.stringify(prevOnlinePeopleRef.current) ===
          JSON.stringify(onlinePeople)
      ) {
        return;
      }

      prevOnlinePeopleRef.current = onlinePeople;

      try {
        const res = await axios.get("people");
        const offlineUsers = res.data.users
          .filter((person) => person._id !== id)
          .filter((person) => !Object.keys(onlinePeople).includes(person._id));
        const updatedOfflinePeople = {};
        offlineUsers.forEach((p) => {
          updatedOfflinePeople[p._id] = p;
        });
        setOfflinePeople(updatedOfflinePeople);
      } catch (err) {
        console.log(err);
      }
    };

    const debounceTimeout = setTimeout(renderOfflineUsers, 500); // Debounce API calls
    return () => clearTimeout(debounceTimeout); // Cleanup on dependency change
  }, [onlinePeople, id]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedUserId) {
        try {
          const res = await axios.get(`/messages/${selectedUserId}`);
          const { history } = res.data;
          if (Array.isArray(history)) {
            setTextMessages(history);
          } else {
            console.error("Unexpected response format:", res.data);
            setTextMessages([]); // Default to empty array if data is not an array
          }
        } catch (error) {
          console.error("Error fetching messages:", error);
          setTextMessages([]); // Handle fetch error gracefully
        }
      }
    };

    fetchMessages();
  }, [selectedUserId]);

  const onlinePeopleExcludingUser = { ...onlinePeople };
  delete onlinePeopleExcludingUser[id];

  const messagesWithoutDupes = uniqBy(textMessages, "_id");
  return (
    <div className="flex h-screen">
      <div className="bg-blue-100 w-1/3 flex flex-col">
        <div className="flex-grow">
          <Logo></Logo>
          {Object.keys(onlinePeopleExcludingUser).map((userId, index) => (
            <Contact
              key={index}
              online={true}
              userId={userId}
              setSelectedUserId={setSelectedUserId}
              username={onlinePeople[userId]}
              selected={userId === selectedUserId}
            />
          ))}
          {Object.keys(offlinePeople).map((userId, index) => (
            <Contact
              key={index}
              online={false}
              userId={userId}
              setSelectedUserId={setSelectedUserId}
              username={offlinePeople[userId].username}
              selected={userId === selectedUserId}
            ></Contact>
          ))}
        </div>

        <div className="p-2 flex gap-2 justify-center items-center">
          <UserDetailLogo username={username}></UserDetailLogo>
          <LogoutButton logout={logout}></LogoutButton>
        </div>
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
          {!!selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute top-0 right-0 left-0 bottom-2">
                {Array.isArray(messagesWithoutDupes) &&
                  messagesWithoutDupes.map((text, index) => (
                    <div
                      key={index}
                      className={
                        text.sender === id ? "text-right" : "text-left"
                      }
                    >
                      <div
                        className={
                          "p-2 my-2 rounded-md text-md mx-2 inline-block text-left " +
                          (text.sender === id
                            ? "bg-blue-700 text-white"
                            : "bg-white text-gray-500")
                        }
                        key={index}
                      >
                        {text.text}
                      </div>
                    </div>
                  ))}
                <div ref={divUnderMessages}></div>
              </div>
            </div>
          )}
        </div>
        {!!selectedUserId && (
          <form className="flex gap-2" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-white border p-4 flex-grow rounded-lg"
              placeholder="Type your message here"
            />
            <SendButton></SendButton>
          </form>
        )}
      </div>
    </div>
  );
}
