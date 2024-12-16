import { createContext, useEffect, useState } from "react";
import axios from "axios";
export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [username, setUsername] = useState(null);
  const [id, setId] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/profile");
        console.log("Profile response:", res.data);
        setId(res.data.userId);
        setUsername(res.data.username);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setId(null);
        setUsername(null);
      }
    };

    fetchProfile(); // Call the async function
  }, []);

  return (
    <UserContext.Provider value={{ username, setUsername, id, setId }}>
      {children}
    </UserContext.Provider>
  );
}
