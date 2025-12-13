// src/components/chat/typing-indicator.tsx

export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 p-2">
      <style>
        {`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1.0); }
          }
          .bounce-dot {
            width: 8px;
            height: 8px;
            background-color: currentColor;
            border-radius: 50%;
            display: inline-block;
            animation: bounce 1.4s infinite ease-in-out both;
          }
          .bounce-dot:nth-child(1) { animation-delay: -0.32s; }
          .bounce-dot:nth-child(2) { animation-delay: -0.16s; }
        `}
      </style>
      <div className="bounce-dot"></div>
      <div className="bounce-dot"></div>
      <div className="bounce-dot"></div>
    </div>
  );
}
