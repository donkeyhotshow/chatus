export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen-safe w-full overflow-hidden">
      {children}
    </div>
  );
}
