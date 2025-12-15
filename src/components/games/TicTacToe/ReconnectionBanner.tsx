import React from 'react';

interface Props {
  reconnecting: boolean;
  connectionLost: boolean;
}

export function ReconnectionBanner({ reconnecting, connectionLost }: Props) {
  if (!connectionLost && !reconnecting) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white p-3 text-center z-50">
      {reconnecting ? (
        <>
          <div className="inline-block animate-spin mr-2">⟳</div>
          Reconnecting to game...
        </>
      ) : (
        <>
          <div className="inline-block mr-2">⚠️</div>
          Connection lost. Attempting to reconnect...
        </>
      )}
    </div>
  );
}




