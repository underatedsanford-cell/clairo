import ActionProvider from './ActionProvider';

class MessageParser {
  actionProvider: ActionProvider;

  constructor(actionProvider: ActionProvider) {
    this.actionProvider = actionProvider;
  }

  parse(message: string) {
    const lowerCaseMessage = message.toLowerCase();

    if (lowerCaseMessage.includes("hello") || lowerCaseMessage.includes("hi")) {
      this.actionProvider.greet();
    } else if (lowerCaseMessage.includes("status")) {
      this.actionProvider.handleSalesAgentStatus();
    } else if (lowerCaseMessage.includes("help")) {
      this.actionProvider.showHelp();
    } else if (lowerCaseMessage.includes("feature") || lowerCaseMessage.includes("features")) {
      this.actionProvider.showFeatures();
    } else if (lowerCaseMessage.includes("pricing") || lowerCaseMessage.includes("price")) {
      this.actionProvider.showPricing();
    } else if (lowerCaseMessage.includes("demo")) {
      this.actionProvider.showDemo();
    } else if (lowerCaseMessage.includes("support")) {
      this.actionProvider.showSupport();
    } else if (lowerCaseMessage.includes("terms")) {
      this.actionProvider.showTerms();
    } else {
      this.actionProvider.handleDefault();
    }
  }
}

export default MessageParser;