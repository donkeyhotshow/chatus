export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function TestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div style={{ padding: '20px', color: 'white', background: 'black' }}>
      <h1>Dynamic Route Works!</h1>
      <p>ID: {id}</p>
    </div>
  );
}
