export default function TestPage() {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">Тест страница</h1>
                <p className="text-lg text-gray-400 mb-8">
                    Эта страница работает без Firebase
                </p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-6 py-3 bg-white text-black rounded hover:bg-gray-200 transition-colors"
                >
                    Назад на главную
                </button>
            </div>
        </div>
    );
}
