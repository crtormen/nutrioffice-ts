import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, Bot, User, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  type?: 'info' | 'warning' | 'error';
}

interface AIAgentResponse {
  message: string;
  confidence: number;
  needsEscalation: boolean;
  suggestedActions?: string[];
}

const CustomerSupportChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI support assistant. How can I help you today?",
      sender: 'agent',
      timestamp: new Date(),
      type: 'info'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const callAIAgent = async (userMessage: string): Promise<AIAgentResponse> => {
    // This would be your actual API call to Manus or another AI service
    const response = await fetch('/api/ai-support', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_AI_API_KEY}`
      },
      body: JSON.stringify({
        message: userMessage,
        context: {
          userId: 'user123',
          sessionId: 'session456',
          previousMessages: messages.slice(-5) // Last 5 messages for context
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    return response.json();
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await callAIAgent(inputMessage);
      
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.message,
        sender: 'agent',
        timestamp: new Date(),
        type: aiResponse.needsEscalation ? 'warning' : 'info'
      };

      setMessages(prev => [...prev, agentMessage]);

      // Handle escalation if needed
      if (aiResponse.needsEscalation) {
        setTimeout(() => {
          const escalationMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: "I'm connecting you with a human agent who can better assist you with this issue.",
            sender: 'agent',
            timestamp: new Date(),
            type: 'warning'
          };
          setMessages(prev => [...prev, escalationMessage]);
        }, 1000);
      }

    } catch (error) {
      console.error('Error calling AI agent:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        sender: 'agent',
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageIcon = (message: Message) => {
    if (message.sender === 'user') {
      return <User className="w-4 h-4" />;
    }
    
    switch (message.type) {
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const getMessageStyle = (message: Message) => {
    const baseStyle = "max-w-xs lg:max-w-md px-4 py-2 rounded-lg";
    
    if (message.sender === 'user') {
      return `${baseStyle} bg-blue-500 text-white`;
    }
    
    switch (message.type) {
      case 'warning':
        return `${baseStyle} bg-yellow-100 text-yellow-800 border border-yellow-300`;
      case 'error':
        return `${baseStyle} bg-red-100 text-red-800 border border-red-300`;
      default:
        return `${baseStyle} bg-gray-200 text-gray-800`;
    }
  };

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="bg-blue-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          AI Customer Support
          {!isConnected && (
            <span className="text-xs bg-red-500 px-2 py-1 rounded">Disconnected</span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.sender === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {getMessageIcon(message)}
              </div>
              
              <div className={getMessageStyle(message)}>
                <p className="text-sm">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-gray-200 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isLoading || !isConnected}
            />
            <Button 
              onClick={handleSendMessage} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading || !isConnected || !inputMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerSupportChat;