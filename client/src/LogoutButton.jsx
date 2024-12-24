export default function LogoutButton({ logout }) {
  return (
    <button
      onClick={logout}
      className="flex items-center gap-2
      font-semibold text-md text-white bg-red-500 hover:py-3
      hover:px-5 hover:text-lg py-2 px-4 rounded-md mb-3 shadow-gray-300 shadow-lg"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="size-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
        />
      </svg>
      Logout
    </button>
  );
}
