
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatMessages } from '../chat-messages';
import { ChatMessage } from '@/lib/api-client';

const messages: ChatMessage[] = [
  { role: 'user', content: 'Hello' },
  {
    role: 'ai',
    content: 'Hi, how can I help you?',
    source: 'This is a source',
  },
];

describe('ChatMessages', () => {
  it('renders the messages', () => {
    const messagesEndRef = { current: null };
    render(
      <ChatMessages
        messages={messages}
        messagesEndRef={messagesEndRef}
        copiedMessageIndex={null}
        handleCopy={() => { }}
      />
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi, how can I help you?')).toBeInTheDocument();
  });

  it('renders the source accordion for AI messages with a source', () => {
    const messagesEndRef = { current: null };
    render(
      <ChatMessages
        messages={messages}
        messagesEndRef={messagesEndRef}
        copiedMessageIndex={null}
        handleCopy={() => { }}
      />
    );
    expect(screen.getByText('Ver Fuente')).toBeInTheDocument();
  });
});
