"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTicTacToeMove = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
    admin.initializeApp();
}
exports.validateTicTacToeMove = functions.firestore
    .document('rooms/{roomId}/games/{gameId}/moves/{moveId}')
    .onCreate(async (snapshot, context) => {
    var _a, _b, _c;
    const move = snapshot.data();
    const { roomId, gameId, moveId } = context.params;
    const gameRef = admin.firestore().doc(`rooms/${roomId}/games/${gameId}`);
    const gameSnap = await gameRef.get();
    if (!gameSnap.exists) {
        await snapshot.ref.update({ valid: false, reason: 'Game not found' });
        return;
    }
    const game = gameSnap.data();
    // Валідація 1: Чи гра активна?
    if (game.status !== 'in_progress') {
        await snapshot.ref.update({ valid: false, reason: 'Game not active' });
        return;
    }
    // Валідація 2: Чи це хід правильного гравця?
    const expectedPlayer = game.currentTurn;
    if (move.player !== expectedPlayer) {
        await snapshot.ref.update({ valid: false, reason: 'Not your turn' });
        return;
    }
    // Валідація 3: Чи гравець має право робити хід?
    if (move.uid !== game.players[expectedPlayer].uid) {
        await snapshot.ref.update({ valid: false, reason: 'Unauthorized player' });
        return;
    }
    // Валідація 4: Чи позиція валідна (в межах 3x3)?
    const [row, col] = move.position;
    if (row < 0 || row > 2 || col < 0 || col > 2) {
        await snapshot.ref.update({ valid: false, reason: 'Invalid position' });
        return;
    }
    // Валідація 5: Чи клітинка пуста?
    if (game.board[row][col] !== null) {
        await snapshot.ref.update({ valid: false, reason: 'Cell already occupied' });
        return;
    }
    // Валідація 6: Перевірка timeout (30 секунд на хід)
    const moveTimestamp = ((_a = move.timestamp) === null || _a === void 0 ? void 0 : _a.toMillis()) || Date.now();
    const lastMoveTime = ((_b = game.lastMoveTime) === null || _b === void 0 ? void 0 : _b.toMillis()) || ((_c = game.createdAt) === null || _c === void 0 ? void 0 : _c.toMillis()) || 0;
    const timeDiff = moveTimestamp - lastMoveTime;
    if (timeDiff > 30000) {
        // Гравець перевищив час → автоматична поразка
        const winner = expectedPlayer === 'player1' ? 'player2' : 'player1';
        await gameRef.update({
            status: 'finished',
            winner: winner,
            finishReason: 'timeout'
        });
        await snapshot.ref.update({ valid: false, reason: 'Move timeout' });
        // Update stats for winner and loser
        await updatePlayerStats(game.players[winner].uid, 'win', gameId);
        await updatePlayerStats(game.players[expectedPlayer].uid, 'loss', gameId);
        return;
    }
    // ✅ ХІД ВАЛІДНИЙ — застосовуємо до board
    const newBoard = game.board.map(row => [...row]);
    newBoard[row][col] = game.players[expectedPlayer].symbol;
    // Перевірка переможця
    const winnerSymbol = checkWinner(newBoard);
    const isDraw = !winnerSymbol && newBoard.every(row => row.every(cell => cell !== null));
    const nextTurn = expectedPlayer === 'player1' ? 'player2' : 'player1';
    await gameRef.update({
        board: newBoard,
        currentTurn: winnerSymbol || isDraw ? null : nextTurn,
        winner: winnerSymbol ? expectedPlayer : (isDraw ? 'draw' : null),
        status: winnerSymbol || isDraw ? 'finished' : 'in_progress',
        moveCount: admin.firestore.FieldValue.increment(1),
        lastMoveTime: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await snapshot.ref.update({
        valid: true,
        appliedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    // Нарахування очок/рейтингу
    if (winnerSymbol) {
        await updatePlayerStats(game.players[expectedPlayer].uid, 'win', gameId);
        const loserKey = expectedPlayer === 'player1' ? 'player2' : 'player1';
        await updatePlayerStats(game.players[loserKey].uid, 'loss', gameId);
    }
    else if (isDraw) {
        await updatePlayerStats(game.players.player1.uid, 'draw', gameId);
        await updatePlayerStats(game.players.player2.uid, 'draw', gameId);
    }
});
function checkWinner(board) {
    // Перевірка рядків
    for (let i = 0; i < 3; i++) {
        if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
            return board[i][0];
        }
    }
    // Перевірка стовпців
    for (let i = 0; i < 3; i++) {
        if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
            return board[0][i];
        }
    }
    // Перевірка діагоналей
    if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
        return board[0][0];
    }
    if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
        return board[0][2];
    }
    return null;
}
async function updatePlayerStats(uid, result, gameId) {
    const statsRef = admin.firestore().doc(`users/${uid}/stats/ticTacToe`);
    const increment = result === 'win' ? 1 : (result === 'loss' ? -1 : 0);
    const winStreakIncrement = result === 'win' ? 1 : 0;
    const lossStreakIncrement = result === 'loss' ? 1 : 0;
    await statsRef.set({
        totalGames: admin.firestore.FieldValue.increment(1),
        wins: result === 'win' ? admin.firestore.FieldValue.increment(1) : admin.firestore.FieldValue.increment(0),
        losses: result === 'loss' ? admin.firestore.FieldValue.increment(1) : admin.firestore.FieldValue.increment(0),
        draws: result === 'draw' ? admin.firestore.FieldValue.increment(1) : admin.firestore.FieldValue.increment(0),
        rating: admin.firestore.FieldValue.increment(increment * 25),
        winStreak: admin.firestore.FieldValue.increment(winStreakIncrement),
        lossStreak: admin.firestore.FieldValue.increment(lossStreakIncrement),
        lastGameId: gameId,
        lastGameAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}
//# sourceMappingURL=validateMove.js.map