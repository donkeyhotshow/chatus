import { ChatRoomWrapper } from './ChatRoomWrapper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room } = await params;

  return <ChatRoomWrapper roomId={room} />;
}
