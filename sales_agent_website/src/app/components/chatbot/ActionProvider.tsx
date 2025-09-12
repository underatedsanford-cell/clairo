import { Dispatch, SetStateAction } from 'react';

interface IBotMessage {
  widget?: string;
  payload?: unknown;
}

interface IPrevState {
  messages: unknown[];
  [key: string]: unknown;
}

class ActionProvider {
  createChatBotMessage: (message: string, options?: IBotMessage) => unknown;
  setState: Dispatch<SetStateAction<IPrevState>>;

  constructor(
    createChatBotMessage: (message: string, options?: IBotMessage) => unknown,
    setStateFunc: Dispatch<SetStateAction<IPrevState>>
  ) {
    this.createChatBotMessage = createChatBotMessage;
    this.setState = setStateFunc;
  }

  greet() {
    const greetingMessage = this.createChatBotMessage("Hi, friend.");
    this.updateChatbotState(greetingMessage);
  }

  async handleSalesAgentStatus() {
    try {
      const response = await fetch('http://localhost:5001/api/status');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      const statusMessage = this.createChatBotMessage(
        `Sales Agent Status:\n- Last Update: ${data.last_update}\n- New Leads Added: ${data.new_leads_added}\n- Outreach Sent: ${data.outreach_sent_count}`
      );
      this.updateChatbotState(statusMessage);
    } catch {
      const errorMessage = this.createChatBotMessage(
        "Sorry, I couldn't retrieve the sales agent status at the moment. Please try again later."
      );
      this.updateChatbotState(errorMessage);
    }
  }

  showHelp() {
    const helpMessage = this.createChatBotMessage(
      "You can ask me about features, pricing, or request a demo. You can also ask for the sales agent's status."
    );
    this.updateChatbotState(helpMessage);
  }

  showFeatures() {
    const featuresMessage = this.createChatBotMessage(
      "You can learn more about our features here:",
      {
        widget: 'link',
        payload: {
          url: '/features',
          text: 'Features'
        }
      }
    );
    this.updateChatbotState(featuresMessage);
  }

  showPricing() {
    const pricingMessage = this.createChatBotMessage(
      "You can find our pricing information here:",
      {
        widget: 'link',
        payload: {
          url: '/pricing',
          text: 'Pricing'
        }
      }
    );
    this.updateChatbotState(pricingMessage);
  }

  showDemo() {
    const demoMessage = this.createChatBotMessage(
      "You can request a demo here:",
      {
        widget: 'link',
        payload: {
          url: '/demo',
          text: 'Request a Demo'
        }
      }
    );
    this.updateChatbotState(demoMessage);
  }

  showSupport() {
    const supportMessage = this.createChatBotMessage(
      "If you need help, you can visit our support page:",
      {
        widget: 'link',
        payload: {
          url: '/support',
          text: 'Support'
        }
      }
    );
    this.updateChatbotState(supportMessage);
  }

  showTerms() {
    const termsMessage = this.createChatBotMessage(
      "You can read our terms and conditions here:",
      {
        widget: 'link',
        payload: {
          url: '/terms',
          text: 'Terms and Conditions'
        }
      }
    );
    this.updateChatbotState(termsMessage);
  }

  handleDefault() {
    const defaultMessage = this.createChatBotMessage(
      "I'm not sure how to help with that. You can ask me about features, pricing, or request a demo."
    );
    this.updateChatbotState(defaultMessage);
  }

  updateChatbotState(message: unknown) {
    this.setState(prevState => ({
      ...prevState,
      messages: [...prevState.messages, message],
    }));
  }
}

export default ActionProvider;