import React from 'react';
import Chatbot from 'react-chatbot-kit';

import config from './config';
import MessageParser from './MessageParser';
import ActionProvider from './ActionProvider';

const Clairo = () => {
  return (
    <div data-testid="chatbot">
      <Chatbot
        config={config}
        messageParser={MessageParser}
        actionProvider={ActionProvider}
      />
    </div>
  );
};

export default Clairo;