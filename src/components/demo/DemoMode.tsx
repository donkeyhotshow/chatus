'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { mockRoomService, mockAI, isTestMode } from '@/lib/mock-services';
import { Room } from '@/types';

export function DemoMode() {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [demoRooms, setDemoRooms] = useState<Room[]>([]);
  const [testMessage, setTestMessage] = useState('');

  const router = useRouter();

  useEffect(() => {
    // Load demo rooms
    setDemoRooms(mockRoomService.getRooms());
  }, []);

  useEffect(() => {
    const trimmedUsername = username.trim();
    const trimmedRoomCode = roomCode.trim();
    const isUsernameValid = trimmedUsername.length >= 2 && trimmedUsername.length <= 20;
    const isRoomCodeValid = trimmedRoomCode.length >= 3 && trimmedRoomCode.length <= 6 && /^[A-Z0-9]+$/.test(trimmedRoomCode);
    setIsFormValid(isUsernameValid && isRoomCodeValid);
  }, [username, roomCode]);

  const handleCreateRoom = async () => {
    if (isConnecting) return;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomCode(result);
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isConnecting || !isFormValid) return;

    const trimmedUsername = username.trim();
    const trimmedRoomCode = roomCode.trim();

    setIsConnecting(true);
    localStorage.setItem('chatUsername', trimmedUsername);
    localStorage.setItem('demoMode', 'true');

    try {
      // Simulate room creation/joining
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/chat/${trimmedRoomCode}`);
    } catch {
      setIsConnecting(false);
    }
  };

  const testAI = async () => {
    const response = await mockAI.generateResponse('Hello, this is a test');
    setTestMessage(response);
  };

  if (!isTestMode()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ChatUs Demo Mode
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Полнофункциональный чат без зависимостей от внешних сервисов
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Firebase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Mock Mode
              </Badge>
              <p className="text-sm text-gray-600 mt-2">
                Локальное хранилище вместо Firebase
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                AI Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Mock Responses
              </Badge>
              <p className="text-sm text-gray-600 mt-2">
                Имитация ответов ИИ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-purple-500" />
                Real-time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                Simulated
              </Badge>
              <p className="text-sm text-gray-600 mt-2">
                Имитация real-time обновлений
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Form */}
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Войти в чат</CardTitle>
            <CardDescription>
              Создайте комнату или присоединитесь к существующей
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinRoom} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Ваш ник
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введите ник"
                  maxLength={20}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Room Code */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    Код комнаты
                  </label>
                  <button
                    type="button"
                    onClick={handleCreateRoom}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Создать
                  </button>
                </div>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>

              <Button
                type="submit"
                disabled={!isFormValid || isConnecting}
                className="w-full"
                size="lg"
              >
                {isConnecting ? 'Подключение...' : 'Войти'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>

            {/* AI Test */}
            <div className="mt-6 pt-6 border-t">
              <button
                onClick={testAI}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                🧠 Протестировать AI
              </button>
              {testMessage && (
                <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm">{testMessage}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Demo Rooms */}
        {demoRooms.length > 0 && (
          <Card className="max-w-md mx-auto mt-6">
            <CardHeader>
              <CardTitle>Демо комнаты</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {demoRooms.map(room => (
                  <div key={room.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">{room.name}</p>
                      <p className="text-sm text-gray-600">{room.participants?.length || 0} участников</p>
                    </div>
                    <Badge variant="outline">{room.id.slice(0, 6)}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Alert */}
        <Alert className="max-w-md mx-auto mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Это демо режим без зависимостей от внешних API.
            Все функции работают локально для тестирования.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
