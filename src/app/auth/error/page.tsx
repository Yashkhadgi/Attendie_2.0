export default function AuthErrorPage() {
  const eklinkUrl = process.env.NEXT_PUBLIC_EKLINK_URL || process.env.EKLINK_URL || "https://ek-link-nine.vercel.app";

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow border border-gray-200 text-center">
        <h1 className="text-xl font-bold text-red-600 mb-4">Authentication Error</h1>
        <p className="text-gray-700 mb-6">
          There was an error signing in to Attendie via EkLink. Please try again or return to EkLink.
        </p>
        <a
          href={`${eklinkUrl}/dashboard`}
          className="inline-block bg-blue-600 text-white font-medium px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Back to EkLink
        </a>
      </div>
    </main>
  );
}
