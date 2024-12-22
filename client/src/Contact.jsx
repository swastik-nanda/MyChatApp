import Avatar from "./Avatar";

export default function Contact({
  setSelectedUserId,
  userId,
  selected,
  index,
  online,
  username,
}) {
  return (
    <div
      onClick={() => setSelectedUserId(userId)}
      className={
        "border-b border-gray-100 flex gap-2 items-center cursor-pointer " +
        (selected ? "bg-blue-200" : "")
      }
      key={index}
    >
      {selected && <div className="w-1 h-12 bg-blue-600 rounded-r-md"></div>}
      <div className="py-2 pl-4 flex gap-2 items-center">
        <Avatar online={online} username={username} userId={userId}></Avatar>
        <span className="text-md text-gray-800">{username}</span>
      </div>
    </div>
  );
}
