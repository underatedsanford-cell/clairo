import { create } from 'zustand';

interface ChatbotState {
  isChatbotOpen: boolean;
  toggleChatbot: () => void;
}

export const useChatbotStore = create<ChatbotState>((set) => ({
  isChatbotOpen: false,
  toggleChatbot: () => set((state) => ({ isChatbotOpen: !state.isChatbotOpen })),
}));