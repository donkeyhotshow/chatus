export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room } = await params;

  return (
    <div style={{ padding: '20px', color: 'white', background: 'black' }}>
      <h1>Chat Room</h1>
      <p>Room ID: {room}</p>
    </div>
  );
}
