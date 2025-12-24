export const dynamic = 'force-dynamic';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room } = await params;

  return <div>Chat room: {room}</div>;
}
