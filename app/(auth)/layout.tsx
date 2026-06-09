export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4 pt-24 pb-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">🍱</span>
          <h1 className="text-2xl font-bold text-green-700 mt-2">আমার কিচেন</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-8">{children}</div>
      </div>
    </div>
  );
}
