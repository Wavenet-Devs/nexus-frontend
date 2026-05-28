export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex items-center justify-center bg-neutral-50 px-4">
      {children}
    </div>
  );
}
