import { HomeClient } from '@/components/home/HomeClient';

// Отключаем статическую генерацию для этой страницы
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <HomeClient />
    </main>
  );
}
