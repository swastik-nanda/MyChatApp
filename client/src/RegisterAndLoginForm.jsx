import axios from "axios";
import { useContext, useState } from "react";
import { UserContext } from "./contexts/UserContext";

export default function RegisterAndLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginOrRegister, setIsLoginOrRegister] = useState("register");

  const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

  async function handleSubmit(ev) {
    ev.preventDefault();
    const url = isLoginOrRegister === "register" ? "register" : "login";
    const { data } = await axios.post(`/${url}`, { username, password });
    setLoggedInUsername(username);
    setId(data.id);
  }
  return (
    <div className="bg-blue-200 h-screen flex items-center">
      <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
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
          {isLoginOrRegister === "register" ? "Register" : "Login"}
        </button>
        <div className="text-center mt-2">
          {isLoginOrRegister === "register" && (
            <div>
              <span className="block">Already a member?</span>
              <button onClick={() => setIsLoginOrRegister("login")}>
                Login here
              </button>
            </div>
          )}
          {isLoginOrRegister === "login" && (
            <div>
              Don&apos;t have an account?
              <button onClick={() => setIsLoginOrRegister("register")}>
                Register here
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
