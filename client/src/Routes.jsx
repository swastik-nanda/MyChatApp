import { useContext } from "react";
import { UserContext } from "./contexts/UserContext";
import RegisterAndLoginForm from "./RegisterAndLoginForm";
import Chat from "./Chat";

export default function Routes() {
  const { username, id } = useContext(UserContext);
  if (username) {
    return <Chat></Chat>;
  }
  return <RegisterAndLoginForm></RegisterAndLoginForm>;
}
