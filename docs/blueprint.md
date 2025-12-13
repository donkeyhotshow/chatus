# **App Name**: ChatForUs

## Core Features:

- Real-time Messaging: Send and receive text messages instantly with typing indicators, message statuses (sent, read), replies, and delete functionality. As reliable as Telegram.
- Shared Canvas Collaboration (Neon Wall): Collaborate on a shared drawing canvas with brush, eraser, and clear all tools, synced via Firestore with debounced saving. Includes color changes and neon glow effect. User cursors are visible.
- Multiplayer Games: Start or participate in real-time synchronized multiplayer games like Tic-Tac-Toe, Rock Paper Scissors, and Click War.
- Emoji Reactions: React to messages with emojis to provide quick and expressive feedback. Reactions are visible to all users.
- Room Access Control: Private access to chat rooms with access control via access code. Enforces a strict two-user limit.
- Draft saving: Text present in the text composition component is retained after disconnection from the room.
- Lightbulb AI assistant tool: LLM decides when to offer assistance in chat, suggesting relevant info based on the conversation, as a tool to enhance user interaction.
- Emoji Rain: When a user double-taps a message, chosen emoji particles erupt as an animated fountain on both users' screens.
- Disappearing messages: Messages disappear after 10 seconds of being read, with a dissolving glitch effect.
- Reaction Addition: Allow users to add emojis as quick reaction, and record who did the adding.
- Neon Wall: Implement a shared drawing canvas where users can draw, erase, and see each other's cursor in real time.
- Rock Paper Scissors: A quick game to determine user actions.
- Click War Game: Click the most before other user in the alotted amount of time. Progress Bar displays the outcome.
- Dice Roll Game: Provide random dice rolls on-demand.

## Style Guidelines:

- Primary color: Deep Indigo (#3F51B5) for a sense of depth, intelligence, and modernity.
- Background color: Very dark indigo (#1A237E) with 20% saturation to complement the primary.
- Accent color: Vibrant Pink (#E91E63) analogous to deep indigo, to highlight CTAs.
- Headline font: 'Space Grotesk', sans-serif for a techy look. Body font: 'Inter', blending with Space Grotesk for a modern interface.
- Use Lucide React Icons for a consistent, clean, and modern look.
- Glassmorphism style for user-interface elements and semi-transparent interface for added depth. Adaptive layout switches to a split view on larger screens.
- Smooth transitions and subtle animations (Tailwind animate-in) for message appearance and interactive elements. Subtle glitch effects for UI transitions.