import { useContext } from "react";
import { UserContext } from "./contexts/UserContext";
import RegisterAndLoginForm from "./RegisterAndLoginForm";

export default function Routes() {
  const { username, id } = useContext(UserContext);
  if (username) {
    return "logged in!" + username;
  }
  return <RegisterAndLoginForm></RegisterAndLoginForm>;
}
