import React from 'react';
import { render, screen } from '@testing-library/react';
import Clairo from '../Clairo';

jest.mock('../config', () => ({
    initialMessages: [],
    botName: 'Clairo',
}));

jest.mock('../MessageParser', () => {
    return jest.fn().mockImplementation(() => {
        return {
            parse: jest.fn(),
        };
    });
});

jest.mock('../ActionProvider', () => {
    return jest.fn().mockImplementation(() => {
        return {
            createChatBotMessage: jest.fn(),
        };
    });
});

describe('Clairo', () => {
  it('renders the chatbot', () => {
    render(<Clairo />);
    const chatbotElement = screen.getByTestId('chatbot');
    expect(chatbotElement).toBeInTheDocument();
  });
});