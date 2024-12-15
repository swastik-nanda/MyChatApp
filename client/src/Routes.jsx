import { useContext } from "react";
import Register from "./Register";
import { UserContext } from "./contexts/UserContext";

export default function Routes() {
  const { username, id } = useContext(UserContext);
  if (username) {
    return "logged in!";
  }
  return <Register></Register>;
}
