import axios from "axios";
import { useContext, useState } from "react";
import { UserContext } from "./contexts/UserContext";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

  async function register(ev) {
    ev.preventDefault();
    const { data } = await axios.post("/register", { username, password });
    setLoggedInUsername(username);
    setId(data.id);
  }
  return (
    <div className="bg-blue-200 h-screen flex items-center">
      <form className="w-64 mx-auto mb-12" onSubmit={register}>
        <input
          type="text"
          onChange={(ev) => setUsername(ev.target.value)}
          value={username}
          placeholder="username"
          className="block w-full rounded-sm p-2 mb-2 border"
        ></input>
        <input
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          type="password"
          placeholder="password"
          className="block w-full rounded-sm p-2 mb-2 border"
        ></input>
        <button className="bg-blue-500 text-white block rounded-sm w-full p-2">
          Register
        </button>
      </form>
    </div>
  );
}
