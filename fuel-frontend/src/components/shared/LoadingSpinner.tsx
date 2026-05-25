export default function LoadingSpinner({ size = 'md', text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  const s = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8';
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`${s} border-2 border-emerald-500 border-t-transparent rounded-full animate-spin`} />
      {text && <p className="text-gray-400 text-sm">{text}</p>}
    </div>
  );
}
