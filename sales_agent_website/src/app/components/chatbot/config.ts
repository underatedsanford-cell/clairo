import { createChatBotMessage } from 'react-chatbot-kit';

const config = {
  botName: 'Clairo',
  initialMessages: [createChatBotMessage(`Hello! I'm Clairo, your AI assistant. How can I help you today?`, {})],
  customStyles: {
    botMessageBox: {
      backgroundColor: '#0f172a',
    },
    chatButton: {
      backgroundColor: '#0f172a',
    },
    userMessageBox: {
      backgroundColor: '#4f46e5',
    },
    chatContainer: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
    header: {
      backgroundColor: '#0f172a',
      color: '#ffffff',
      padding: '12px',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
    },
    input: {
      backgroundColor: '#f1f5f9',
      color: '#0f172a',
      placeholderColor: '#94a3b8',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      padding: '10px',
    },
  },
};

export default config;