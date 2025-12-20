import { HomeClient } from '@/components/home/HomeClientStub';
// import { DemoMode } from '@/components/demo/DemoMode';
// import { HomeClient } from '@/components/home/HomeClient';

// Отключаем статическую генерацию для этой страницы
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <HomeClient />
      {/* <DemoMode /> */}
      {/* <div>Home Page (Debug)</div> */}
    </main>
  );
}
