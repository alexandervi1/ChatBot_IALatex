
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatInput } from '../chat-input';

describe('ChatInput', () => {
  it('renders the input and button', () => {
    render(<ChatInput input="" setInput={() => { }} handleSubmit={() => { }} isLoading={false} />);
    expect(screen.getByPlaceholderText('Escribe tu pregunta aquí...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('disables the input and button when isLoading is true', () => {
    render(<ChatInput input="" setInput={() => { }} handleSubmit={() => { }} isLoading={true} />);
    expect(screen.getByPlaceholderText('Escribe tu pregunta aquí...')).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('enables the input and button when isLoading is false', () => {
    render(<ChatInput input="" setInput={() => { }} handleSubmit={() => { }} isLoading={false} />);
    expect(screen.getByPlaceholderText('Escribe tu pregunta aquí...')).toBeEnabled();
    expect(screen.getByRole('button')).toBeEnabled();
  });
});
