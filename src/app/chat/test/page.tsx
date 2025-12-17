export const dynamic = 'force-dynamic';

export default function TestChatPage() {
    return (
        <div className="h-full w-full flex items-center justify-center bg-black text-white">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">🎉 Тест успешен!</h1>
                <p className="text-xl">Роутинг работает корректно</p>
                <p className="text-sm text-gray-400 mt-4">Это тестовая страница чата</p>
            </div>
        </div>
    );
}
