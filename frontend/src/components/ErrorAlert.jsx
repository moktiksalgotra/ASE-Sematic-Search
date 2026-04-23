function ErrorAlert({ message }) {
  if (!message) return null;

  return (
    <div className="mb-6 rounded-xl border border-red-100 bg-red-50/50 p-4 flex items-center gap-3 text-sm text-red-600 animate-in fade-in zoom-in duration-300">
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="font-medium">{message}</span>
    </div>
  );
}

export default ErrorAlert;
