function LoadingSpinner({ label = "" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="h-10 w-10 rounded-full border-2 border-tf-blue/10" />
        <div className="absolute top-0 h-10 w-10 animate-spin rounded-full border-2 border-tf-blue border-t-transparent" />
      </div>
      {label && <span className="text-xs font-bold text-tf-blue uppercase tracking-widest">{label}</span>}
    </div>
  );
}

export default LoadingSpinner;
