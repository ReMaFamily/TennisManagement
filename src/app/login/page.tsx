import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🎾</div>
          <h1 className="text-xl font-semibold text-gray-900">Tenis trenér</h1>
          <p className="text-sm text-gray-500 mt-1">Přihlaste se ke správě tréninků</p>
        </div>
        <div className="card">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
