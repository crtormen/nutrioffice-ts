import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

interface AIAgentRequest {
  message: string;
  context: {
    userId: string;
    sessionId: string;
    previousMessages?: any[];
  };
}

interface AIAgentResponse {
  message: string;
  confidence: number;
  needsEscalation: boolean;
  suggestedActions?: string[];
}

// Multi-agent system
class CustomerSupportOrchestrator {
  private agents: Map<string, any> = new Map();

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents() {
    // Initialize different specialized agents
    this.agents.set('triage', new TriageAgent());
    this.agents.set('technical', new TechnicalSupportAgent());
    this.agents.set('billing', new BillingAgent());
    this.agents.set('general', new GeneralSupportAgent());
  }

  async processRequest(request: AIAgentRequest): Promise<AIAgentResponse> {
    // Determine which agent should handle this request
    const agentType = await this.determineAgentType(request.message);
    const agent = this.agents.get(agentType);

    if (!agent) {
      return {
        message: "I'm sorry, I couldn't determine how to help with that. Let me connect you with a human agent.",
        confidence: 0,
        needsEscalation: true
      };
    }

    return agent.process(request);
  }

  private async determineAgentType(message: string): Promise<string> {
    // Simple keyword-based routing (in production, use ML classification)
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('billing') || lowerMessage.includes('payment') || lowerMessage.includes('invoice')) {
      return 'billing';
    }
    
    if (lowerMessage.includes('technical') || lowerMessage.includes('bug') || lowerMessage.includes('error')) {
      return 'technical';
    }
    
    return 'general';
  }
}

// Base agent class
abstract class BaseAgent {
  abstract process(request: AIAgentRequest): Promise<AIAgentResponse>;
  
  protected async callExternalAI(prompt: string): Promise<string> {
    // This would call your actual AI service (OpenAI, Anthropic, etc.)
    // For demo purposes, returning a mock response
    return "This is a mock AI response. In production, this would call your AI service.";
  }
}

class TriageAgent extends BaseAgent {
  async process(request: AIAgentRequest): Promise<AIAgentResponse> {
    // Analyze the request and route to appropriate agent
    const response = await this.callExternalAI(`
      Analyze this customer request and determine the appropriate department:
      "${request.message}"
      
      Respond with routing information and initial response.
    `);

    return {
      message: response,
      confidence: 0.8,
      needsEscalation: false
    };
  }
}

class TechnicalSupportAgent extends BaseAgent {
  async process(request: AIAgentRequest): Promise<AIAgentResponse> {
    const response = await this.callExternalAI(`
      Provide technical support for this issue:
      "${request.message}"
      
      Include troubleshooting steps and solutions.
    `);

    return {
      message: response,
      confidence: 0.7,
      needsEscalation: false,
      suggestedActions: ['Check logs', 'Restart service', 'Update configuration']
    };
  }
}

class BillingAgent extends BaseAgent {
  async process(request: AIAgentRequest): Promise<AIAgentResponse> {
    const response = await this.callExternalAI(`
      Handle this billing inquiry:
      "${request.message}"
      
      Provide helpful billing information and next steps.
    `);

    return {
      message: response,
      confidence: 0.9,
      needsEscalation: false
    };
  }
}

class GeneralSupportAgent extends BaseAgent {
  async process(request: AIAgentRequest): Promise<AIAgentResponse> {
    const response = await this.callExternalAI(`
      Provide general customer support for:
      "${request.message}"
      
      Be helpful and friendly.
    `);

    return {
      message: response,
      confidence: 0.6,
      needsEscalation: false
    };
  }
}

// Initialize orchestrator
const orchestrator = new CustomerSupportOrchestrator();

// API endpoint
app.post('/api/ai-support', [
  body('message').isString().isLength({ min: 1, max: 1000 }),
  body('context.userId').isString(),
  body('context.sessionId').isString()
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const request: AIAgentRequest = req.body;
    const response = await orchestrator.processRequest(request);
    
    // Log the interaction for analytics
    console.log(`AI Support - User: ${request.context.userId}, Session: ${request.context.sessionId}, Confidence: ${response.confidence}`);
    
    res.json(response);
  } catch (error) {
    console.error('Error processing AI request:', error);
    res.status(500).json({
      message: "I'm sorry, I'm experiencing technical difficulties. Please try again later.",
      confidence: 0,
      needsEscalation: true
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AI Support API server running on port ${PORT}`);
});