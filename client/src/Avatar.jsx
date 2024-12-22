export default function Avatar({ online, userId, username }) {
  const colors = [
    "bg-red-400",
    "bg-green-400",
    "bg-purple-400",
    "bg-blue-400",
    "bg-yellow-400",
    "bg-orange-400",
    "bg-teal-400",
  ];
  const userIdBase10 = parseInt(userId, 16);
  const colorIndex = userIdBase10 % colors.length;
  const color = colors[colorIndex];

  return (
    <div className={"w-8 h-8 relative rounded-full flex items-center " + color}>
      <div className="text-center w-full opacity-70">
        {/* Ensure safe access to the first character of username */}
        {username ? username[0].toUpperCase() : "?"}
      </div>
      {online && (
        <div className="absolute w-3 h-3 border border-white shadow-lg shadow-black bg-green-500 rounded-full bottom-0 right-0"></div>
      )}
      {!online && (
        <div className="absolute w-3 h-3 border border-white shadow-lg shadow-black bg-gray-500 rounded-full bottom-0 right-0"></div>
      )}
    </div>
  );
}
