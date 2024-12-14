import { useState } from "react";

export default function Register() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="bg-blue-200 h-screen flex items-center">
      <form className="w-64 mx-auto mb-12">
        <input
          type="text"
          onChange={(ev) => setUserName(ev.target.value)}
          value={userName}
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
