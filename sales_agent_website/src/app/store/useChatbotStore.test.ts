import { renderHook, act } from '@testing-library/react';
import { useChatbotStore } from './useChatbotStore';

describe('useChatbotStore', () => {
  it('should have a default state of isChatbotOpen as false', () => {
    const { result } = renderHook(() => useChatbotStore());
    expect(result.current.isChatbotOpen).toBe(false);
  });

  it('should toggle isChatbotOpen state', () => {
    const { result } = renderHook(() => useChatbotStore());

    act(() => {
      result.current.toggleChatbot();
    });

    expect(result.current.isChatbotOpen).toBe(true);

    act(() => {
      result.current.toggleChatbot();
    });

    expect(result.current.isChatbotOpen).toBe(false);
  });
});