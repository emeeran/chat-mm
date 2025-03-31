/**
 * Available models configuration for different providers
 */
export const availableModels = {
  'openai': [
    { id: 'gpt-4o', name: 'GPT-4o', description: 'Optimized GPT-4 with improved performance' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Optimized for balance of capability and speed' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Good balance of capability and speed' },
    { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model, better reasoning' }
  ],
  'groq': [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', description: 'Latest Llama model optimized for Groq\'s platform' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', description: 'Fast, smaller Llama model' },
    { id: 'qwen-qwq-32b', name: 'Qwen QwQ 32B', description: 'Large Qwen model' },
    { id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder 32B', description: 'Specialized for programming tasks' },
    { id: 'deepseek-r1-distill-qwen-32b', name: 'DeepSeek R1 Qwen 32B', description: 'Distilled model with reasoning capabilities' },
    { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Llama 70B', description: 'Large distilled model with reasoning' }
  ],
  'anthropic': [
    { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', description: 'Fastest Claude model for quick responses' },
    { id: 'claude-3-7-sonnet-latest', name: 'Claude 3.7 Sonnet', description: 'Balanced model with strong capabilities' },
    { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', description: 'Previous generation Sonnet model' },
    { id: 'claude-3-opus-latest', name: 'Claude 3 Opus', description: 'Most capable Claude model with deepest reasoning' }
  ],
  'mistral': [
    { id: 'codestral-latest', name: 'Codestral', description: 'Latest code-optimized model from Mistral' },
    { id: 'mistral-large-latest', name: 'Mistral Large', description: 'Largest and most capable Mistral model' },
    { id: 'mistral-small-latest', name: 'Mistral Small', description: 'Smaller, faster Mistral model' },
    { id: 'pen-mistral-nemo', name: 'Open Mistral NeMo', description: 'Open edition of Mistral using NeMo framework' }
  ],
  'cohere': [
    { id: 'command-r-plus-08-2024', name: 'Command R+ (08/2024)', description: 'Latest R+ model with improved reasoning' },
    { id: 'command-r7b-12-2024', name: 'Command R7B (12/2024)', description: 'Latest 7B model, fast and efficient' },
    { id: 'command-nightly', name: 'Command Nightly', description: 'Latest nightly build with newest features' }
  ],
  'huggingface': [
    { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', description: 'Meta\'s largest Llama 3.3 model' },
    { id: 'deepseek-ai/DeepSeek-Coder-V2-Instruct', name: 'DeepSeek Coder V2', description: 'Programming-focused model' },
    { id: 'meta-llama/Llama-3.1-70B-Instruct', name: 'Llama 3.1 70B', description: 'Meta\'s Llama 3.1 model' },
    { id: 'tencent/HunyuanVideo', name: 'Hunyuan Video', description: 'Video generation model' },
    { id: 'openai/whisper-large-v3', name: 'Whisper Large v3', description: 'Speech-to-text model' },
    { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', description: 'General purpose model' },
    { id: 'openai/whisper-large-v3-turbo', name: 'Whisper Large v3 Turbo', description: 'Faster speech-to-text model' },
    { id: 'meta-llama/Llama-3.2-3B-Instruct', name: 'Llama 3.2 3B', description: 'Small, efficient Llama model' },
    { id: 'perplexity-ai/r1-1776', name: 'Perplexity R1', description: 'Model focused on knowledge access and reasoning' },
    { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1', description: 'Reasoning-focused model' },
    { id: 'Qwen/QwQ-32B', name: 'QwQ 32B', description: 'Alibaba\'s large multimodal model' },
    { id: 'deepseek-ai/Janus-Pro-7B', name: 'Janus Pro 7B', description: 'Professional use-oriented model' },
    { id: 'microsoft/Phi-4-multimodal-instruct', name: 'Phi-4 Multimodal', description: 'Microsoft\'s multimodal model' }
  ],
  'xai': [
    { id: 'grok-2-latest', name: 'Grok 2', description: 'Current Grok model for text conversations' },
    { id: 'grok-2-vision-latest', name: 'Grok 2 Vision', description: 'Multimodal Grok model that can process images' }
  ],
  'deepseek': [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', description: 'General conversational model' },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', description: 'Enhanced reasoning capabilities' }
  ],
  'alibaba': [
    { id: 'qwq-plus', name: 'QwQ Plus', description: 'Alibaba\'s DashScope QwQ Plus model' },
    { id: 'qwq', name: 'QwQ', description: 'Alibaba\'s DashScope QwQ model' },
    { id: 'qwen-vl-plus', name: 'Qwen VL Plus', description: 'Alibaba\'s multimodal model for vision and language' },
    { id: 'qwen-vl-max', name: 'Qwen VL Max', description: 'Alibaba\'s larger multimodal model for vision and language' }
  ]
};

/**
 * Provider warnings configuration
 * Used to show API key warnings or other provider-specific issues
 */
export const providerWarnings = {
  // Example: set to true if API key is missing or invalid
  'openai': false,
  'groq': false,
  'anthropic': false,
  'mistral': false,
  'cohere': false,
  'huggingface': false,
  'xai': false,
  'deepseek': false,
  'alibaba': false
}; 