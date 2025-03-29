import os
from typing import Any, Dict, List, Optional, Iterator, Sequence
from langchain_openai import ChatOpenAI
from langchain_community.llms import Cohere
from langchain_community.llms.huggingface_hub import HuggingFaceHub
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.callbacks.base import BaseCallbackManager
from langchain_core.callbacks import CallbackManagerForLLMRun, Callbacks
from langchain_core.language_models.llms import LLM
from langchain_core.outputs import Generation, GenerationChunk
import cohere
import logging

logger = logging.getLogger(__name__)

class CohereClientV2Wrapper(LLM):
    """Wrapper around Cohere ClientV2 API"""
    
    client: Any
    model: str = "command-r-plus-08-2024"
    temperature: float = 0.7
    streaming: bool = True
    callbacks: Optional[Callbacks] = None
    
    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        """Call out to Cohere's ClientV2 API."""
        try:
            if self.streaming and run_manager:
                stream_iter = self._stream(prompt, stop=stop, run_manager=run_manager, **kwargs)
                return "".join([chunk.text for chunk in stream_iter])
            
            messages = [{"role": "user", "content": prompt}]
            
            response = self.client.chat(
                model=self.model,
                messages=messages,
                temperature=self.temperature
            )
            
            return response.message.content[0].text
        except Exception as e:
            error_msg = f"Error with Cohere API: {str(e)}"
            logger.error(error_msg)
            # Return a fallback response rather than crashing
            return f"I encountered an error connecting to Cohere's services. Please try another provider or check your API key configuration. Error: {str(e)}"
    
    def _stream(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> Iterator[GenerationChunk]:
        """Stream the response."""
        messages = [{"role": "user", "content": prompt}]
        
        try:
            stream_response = self.client.chat_stream(
                model=self.model,
                messages=messages,
                temperature=self.temperature
            )
            
            text = ""
            for chunk in stream_response:
                if not chunk.event_type == "text-generation":
                    continue
                    
                chunk_text = chunk.text
                text += chunk_text
                
                chunk = GenerationChunk(text=chunk_text)
                if run_manager:
                    run_manager.on_llm_new_token(chunk_text)
                yield chunk
        except Exception as e:
            error_msg = f"Error streaming from Cohere API: {str(e)}"
            logger.error(error_msg)
            error_chunk = GenerationChunk(text=f"\nError: {str(e)}")
            if run_manager:
                run_manager.on_llm_new_token(f"\nError: {str(e)}")
            yield error_chunk
    
    @property
    def _llm_type(self) -> str:
        return "cohere-client-v2"

class GroqWrapper(LLM):
    """Wrapper around Groq API"""
    
    api_key: str 
    model: str = "llama-3.3-70b-versatile"
    temperature: float = 0.7
    streaming: bool = True
    callbacks: Optional[Callbacks] = None
    
    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        try:
            # Import here to avoid requiring groq package unless this provider is used
            import groq
            
            client = groq.Client(api_key=self.api_key)
            
            if self.streaming and run_manager:
                stream_iter = self._stream(prompt, stop=stop, run_manager=run_manager, **kwargs)
                return "".join([chunk.text for chunk in stream_iter])
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature
            )
            
            return response.choices[0].message.content
        except Exception as e:
            error_msg = f"Error with Groq API: {str(e)}"
            logger.error(error_msg)
            return f"I encountered an error connecting to Groq's services. Please try another provider or check your API key configuration. Error: {str(e)}"
    
    def _stream(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> Iterator[GenerationChunk]:
        try:
            import groq
            
            client = groq.Client(api_key=self.api_key)
            
            stream_response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                stream=True
            )
            
            for chunk in stream_response:
                if not chunk.choices:
                    continue
                
                chunk_text = chunk.choices[0].delta.content or ""
                
                if chunk_text:
                    chunk = GenerationChunk(text=chunk_text)
                    if run_manager:
                        run_manager.on_llm_new_token(chunk_text)
                    yield chunk
        except Exception as e:
            error_msg = f"Error streaming from Groq API: {str(e)}"
            logger.error(error_msg)
            error_chunk = GenerationChunk(text=f"\nError: {str(e)}")
            if run_manager:
                run_manager.on_llm_new_token(f"\nError: {str(e)}")
            yield error_chunk
    
    @property
    def _llm_type(self) -> str:
        return "groq"

class MistralWrapper(LLM):
    """Wrapper around Mistral API"""
    
    api_key: str
    model: str = "codestral-latest"
    temperature: float = 0.7
    streaming: bool = True
    callbacks: Optional[Callbacks] = None
    
    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        try:
            # Import here to avoid requiring mistralai package unless this provider is used
            from mistralai.client import MistralClient
            from mistralai.models.chat_completion import ChatMessage
            
            client = MistralClient(api_key=self.api_key)
            
            if self.streaming and run_manager:
                stream_iter = self._stream(prompt, stop=stop, run_manager=run_manager, **kwargs)
                return "".join([chunk.text for chunk in stream_iter])
            
            messages = [ChatMessage(role="user", content=prompt)]
            
            response = client.chat(
                model=self.model,
                messages=messages,
                temperature=self.temperature
            )
            
            return response.choices[0].message.content
        except Exception as e:
            error_msg = f"Error with Mistral API: {str(e)}"
            logger.error(error_msg)
            return f"I encountered an error connecting to Mistral's services. Please try another provider or check your API key configuration. Error: {str(e)}"
    
    def _stream(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> Iterator[GenerationChunk]:
        try:
            from mistralai.client import MistralClient
            from mistralai.models.chat_completion import ChatMessage
            
            client = MistralClient(api_key=self.api_key)
            
            messages = [ChatMessage(role="user", content=prompt)]
            
            stream_response = client.chat_stream(
                model=self.model,
                messages=messages,
                temperature=self.temperature
            )
            
            for chunk in stream_response:
                chunk_text = chunk.choices[0].delta.content or ""
                
                if chunk_text:
                    chunk = GenerationChunk(text=chunk_text)
                    if run_manager:
                        run_manager.on_llm_new_token(chunk_text)
                    yield chunk
        except Exception as e:
            error_msg = f"Error streaming from Mistral API: {str(e)}"
            logger.error(error_msg)
            error_chunk = GenerationChunk(text=f"\nError: {str(e)}")
            if run_manager:
                run_manager.on_llm_new_token(f"\nError: {str(e)}")
            yield error_chunk
    
    @property
    def _llm_type(self) -> str:
        return "mistral"

class AnthropicWrapper(LLM):
    """Wrapper around Anthropic API"""
    
    api_key: str
    model: str = "claude-3-5-haiku-latest"
    temperature: float = 0.7
    streaming: bool = True
    callbacks: Optional[Callbacks] = None
    
    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        try:
            # Import here to avoid requiring anthropic package unless this provider is used
            import anthropic
            
            client = anthropic.Anthropic(api_key=self.api_key)
            
            if self.streaming and run_manager:
                stream_iter = self._stream(prompt, stop=stop, run_manager=run_manager, **kwargs)
                return "".join([chunk.text for chunk in stream_iter])
            
            message = client.messages.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature
            )
            
            return message.content[0].text
        except Exception as e:
            error_msg = f"Error with Anthropic API: {str(e)}"
            logger.error(error_msg)
            return f"I encountered an error connecting to Anthropic's services. Please try another provider or check your API key configuration. Error: {str(e)}"
    
    def _stream(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> Iterator[GenerationChunk]:
        try:
            import anthropic
            
            client = anthropic.Anthropic(api_key=self.api_key)
            
            stream = client.messages.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                stream=True
            )
            
            for chunk in stream:
                if not hasattr(chunk, 'delta') or not hasattr(chunk.delta, 'text'):
                    continue
                
                chunk_text = chunk.delta.text or ""
                
                if chunk_text:
                    chunk = GenerationChunk(text=chunk_text)
                    if run_manager:
                        run_manager.on_llm_new_token(chunk_text)
                    yield chunk
        except Exception as e:
            error_msg = f"Error streaming from Anthropic API: {str(e)}"
            logger.error(error_msg)
            error_chunk = GenerationChunk(text=f"\nError: {str(e)}")
            if run_manager:
                run_manager.on_llm_new_token(f"\nError: {str(e)}")
            yield error_chunk
    
    @property
    def _llm_type(self) -> str:
        return "anthropic"

class XaiWrapper(LLM):
    """Wrapper around X AI (Grok) API"""
    
    api_key: str
    model: str = "grok-2-latest"
    temperature: float = 0.7
    streaming: bool = True
    callbacks: Optional[Callbacks] = None
    
    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        try:
            # Import here to avoid requiring xai package unless this provider is used
            import xai
            
            client = xai.Client(api_key=self.api_key)
            
            if self.streaming and run_manager:
                stream_iter = self._stream(prompt, stop=stop, run_manager=run_manager, **kwargs)
                return "".join([chunk.text for chunk in stream_iter])
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature
            )
            
            return response.choices[0].message.content
        except Exception as e:
            error_msg = f"Error with X AI API: {str(e)}"
            logger.error(error_msg)
            return f"I encountered an error connecting to X AI's services. Please try another provider or check your API key configuration. Error: {str(e)}"
    
    def _stream(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> Iterator[GenerationChunk]:
        try:
            import xai
            
            client = xai.Client(api_key=self.api_key)
            
            stream_response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                stream=True
            )
            
            for chunk in stream_response:
                if not chunk.choices:
                    continue
                
                chunk_text = chunk.choices[0].delta.content or ""
                
                if chunk_text:
                    chunk = GenerationChunk(text=chunk_text)
                    if run_manager:
                        run_manager.on_llm_new_token(chunk_text)
                    yield chunk
        except Exception as e:
            error_msg = f"Error streaming from X AI API: {str(e)}"
            logger.error(error_msg)
            error_chunk = GenerationChunk(text=f"\nError: {str(e)}")
            if run_manager:
                run_manager.on_llm_new_token(f"\nError: {str(e)}")
            yield error_chunk
    
    @property
    def _llm_type(self) -> str:
        return "xai"

class DeepseekWrapper(LLM):
    """Wrapper around Deepseek API"""
    
    api_key: str
    model: str = "deepseek-chat"
    temperature: float = 0.7
    streaming: bool = True
    callbacks: Optional[Callbacks] = None
    
    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        try:
            # Import here to avoid requiring deepseek package unless this provider is used
            import deepseek
            
            client = deepseek.Client(api_key=self.api_key)
            
            if self.streaming and run_manager:
                stream_iter = self._stream(prompt, stop=stop, run_manager=run_manager, **kwargs)
                return "".join([chunk.text for chunk in stream_iter])
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature
            )
            
            return response.choices[0].message.content
        except Exception as e:
            error_msg = f"Error with Deepseek API: {str(e)}"
            logger.error(error_msg)
            return f"I encountered an error connecting to Deepseek's services. Please try another provider or check your API key configuration. Error: {str(e)}"
    
    def _stream(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> Iterator[GenerationChunk]:
        try:
            import deepseek
            
            client = deepseek.Client(api_key=self.api_key)
            
            stream_response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                stream=True
            )
            
            for chunk in stream_response:
                if not chunk.choices:
                    continue
                
                chunk_text = chunk.choices[0].delta.content or ""
                
                if chunk_text:
                    chunk = GenerationChunk(text=chunk_text)
                    if run_manager:
                        run_manager.on_llm_new_token(chunk_text)
                    yield chunk
        except Exception as e:
            error_msg = f"Error streaming from Deepseek API: {str(e)}"
            logger.error(error_msg)
            error_chunk = GenerationChunk(text=f"\nError: {str(e)}")
            if run_manager:
                run_manager.on_llm_new_token(f"\nError: {str(e)}")
            yield error_chunk
    
    @property
    def _llm_type(self) -> str:
        return "deepseek"

class AlibabaWrapper(LLM):
    """Wrapper around Alibaba DashScope API using OpenAI compatible mode"""
    
    api_key: str
    model: str = "qwq-plus"
    temperature: float = 0.7
    streaming: bool = True
    callbacks: Optional[Callbacks] = None
    
    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        try:
            # Import here to avoid requiring openai package unless this provider is used
            from openai import OpenAI
            
            client = OpenAI(
                api_key=self.api_key,
                base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
            )
            
            if self.streaming and run_manager:
                stream_iter = self._stream(prompt, stop=stop, run_manager=run_manager, **kwargs)
                return "".join([chunk.text for chunk in stream_iter])
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature
            )
            
            return response.choices[0].message.content
        except Exception as e:
            error_msg = f"Error with Alibaba API: {str(e)}"
            logger.error(error_msg)
            return f"I encountered an error connecting to Alibaba's services. Please try another provider or check your API key configuration. Error: {str(e)}"
    
    def _stream(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> Iterator[GenerationChunk]:
        try:
            from openai import OpenAI
            
            client = OpenAI(
                api_key=self.api_key,
                base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
            )
            
            stream_response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                stream=True
            )
            
            for chunk in stream_response:
                if not chunk.choices:
                    continue
                
                delta = chunk.choices[0].delta
                chunk_text = ""
                
                # Extract content from delta
                if hasattr(delta, 'content') and delta.content is not None:
                    chunk_text = delta.content
                # If we have reasoning_content (Alibaba-specific), also use it
                elif hasattr(delta, 'reasoning_content') and delta.reasoning_content is not None:
                    chunk_text = delta.reasoning_content
                
                if chunk_text:
                    chunk = GenerationChunk(text=chunk_text)
                    if run_manager:
                        run_manager.on_llm_new_token(chunk_text)
                    yield chunk
        except Exception as e:
            error_msg = f"Error streaming from Alibaba API: {str(e)}"
            logger.error(error_msg)
            error_chunk = GenerationChunk(text=f"\nError: {str(e)}")
            if run_manager:
                run_manager.on_llm_new_token(f"\nError: {str(e)}")
            yield error_chunk
    
    @property
    def _llm_type(self) -> str:
        return "alibaba"

class LLMFactory:
    """Factory class to create different LLM instances based on provider"""
    
    # Define available models for each provider
    AVAILABLE_MODELS = {
        'openai': [
            {'id': 'gpt-4o-mini', 'name': 'GPT-4o Mini', 'description': 'Optimized for balance of capability and speed'},
            {'id': 'gpt-3.5-turbo', 'name': 'GPT-3.5 Turbo', 'description': 'Good balance of capability and speed'},
            {'id': 'gpt-4', 'name': 'GPT-4', 'description': 'Most capable model, better reasoning'},
            {'id': 'gpt-4o', 'name': 'GPT-4o', 'description': 'Optimized GPT-4 with improved performance'},
        ],
        'cohere': [
            {'id': 'command-r-plus-08-2024', 'name': 'Command R+ (08/2024)', 'description': 'Latest R+ model with improved reasoning'},
            {'id': 'command-r7b-12-2024', 'name': 'Command R7B (12/2024)', 'description': 'Latest 7B model, fast and efficient'},
            {'id': 'command-nightly', 'name': 'Command Nightly', 'description': 'Latest nightly build with newest features'},
            {'id': 'command-r-plus-08-2024', 'name': 'Command R+ (08/2024)', 'description': 'Latest R+ model with improved reasoning'},
        ],
        'huggingface': [
            {'id': 'meta-llama/Llama-3.3-70B-Instruct', 'name': 'Llama 3.3 70B', 'description': 'Meta\'s largest Llama 3.3 model'},
            {'id': 'deepseek-ai/DeepSeek-Coder-V2-Instruct', 'name': 'DeepSeek Coder V2', 'description': 'Programming-focused model'},
            {'id': 'meta-llama/Llama-3.1-70B-Instruct', 'name': 'Llama 3.1 70B', 'description': 'Meta\'s Llama 3.1 model'},
            {'id': 'tencent/HunyuanVideo', 'name': 'Hunyuan Video', 'description': 'Video generation model'},
            {'id': 'openai/whisper-large-v3', 'name': 'Whisper Large v3', 'description': 'Speech-to-text model'},
            {'id': 'deepseek-ai/DeepSeek-V3', 'name': 'DeepSeek V3', 'description': 'General purpose model'},
            {'id': 'openai/whisper-large-v3-turbo', 'name': 'Whisper Large v3 Turbo', 'description': 'Faster speech-to-text model'},
            {'id': 'meta-llama/Llama-3.2-3B-Instruct', 'name': 'Llama 3.2 3B', 'description': 'Small, efficient Llama model'},
            {'id': 'perplexity-ai/r1-1776', 'name': 'Perplexity R1', 'description': 'Model focused on knowledge access and reasoning'},
            {'id': 'deepseek-ai/DeepSeek-R1', 'name': 'DeepSeek R1', 'description': 'Reasoning-focused model'},
            {'id': 'Qwen/QwQ-32B', 'name': 'QwQ 32B', 'description': 'Alibaba\'s large multimodal model'},
            {'id': 'deepseek-ai/Janus-Pro-7B', 'name': 'Janus Pro 7B', 'description': 'Professional use-oriented model'},
            {'id': 'microsoft/Phi-4-multimodal-instruct', 'name': 'Phi-4 Multimodal', 'description': 'Microsoft\'s multimodal model'},
        ],
        'groq': [
            {'id': 'llama-3.3-70b-versatile', 'name': 'Llama 3.3 70B Versatile', 'description': 'Latest Llama model optimized for Groq\'s platform'},
            {'id': 'llama-3.1-8b-instant', 'name': 'Llama 3.1 8B Instant', 'description': 'Fast, smaller Llama model'},
            {'id': 'qwen-qwq-32b', 'name': 'Qwen QwQ 32B', 'description': 'Large Qwen model'},
            {'id': 'qwen-2.5-coder-32b', 'name': 'Qwen 2.5 Coder 32B', 'description': 'Specialized for programming tasks'},
            {'id': 'deepseek-r1-distill-qwen-32b', 'name': 'DeepSeek R1 Qwen 32B', 'description': 'Distilled model with reasoning capabilities'},
            {'id': 'deepseek-r1-distill-llama-70b', 'name': 'DeepSeek R1 Llama 70B', 'description': 'Large distilled model with reasoning'},
        ],
        'mistral': [
            {'id': 'codestral-latest', 'name': 'Codestral', 'description': 'Latest code-optimized model from Mistral'},
            {'id': 'mistral-large-latest', 'name': 'Mistral Large', 'description': 'Largest and most capable Mistral model'},
            {'id': 'mistral-small-latest', 'name': 'Mistral Small', 'description': 'Smaller, faster Mistral model'},
            {'id': 'pen-mistral-nemo', 'name': 'Open Mistral NeMo', 'description': 'Open edition of Mistral using NeMo framework'},
        ],
        'anthropic': [
            {'id': 'claude-3-5-haiku-latest', 'name': 'Claude 3.5 Haiku', 'description': 'Fastest Claude model for quick responses'},
            {'id': 'claude-3-7-sonnet-latest', 'name': 'Claude 3.7 Sonnet', 'description': 'Balanced model with strong capabilities'},
            {'id': 'claude-3-5-sonnet-latest', 'name': 'Claude 3.5 Sonnet', 'description': 'Previous generation Sonnet model'},
            {'id': 'claude-3-opus-latest', 'name': 'Claude 3 Opus', 'description': 'Most capable Claude model with deepest reasoning'},
        ],
        'xai': [
            {'id': 'grok-2-latest', 'name': 'Grok 2', 'description': 'Current Grok model for text conversations'},
            {'id': 'grok-2-vision-latest', 'name': 'Grok 2 Vision', 'description': 'Multimodal Grok model that can process images'},
        ],
        'deepseek': [
            {'id': 'deepseek-chat', 'name': 'DeepSeek Chat', 'description': 'General conversational model'},
            {'id': 'deepseek-reasoner', 'name': 'DeepSeek Reasoner', 'description': 'Enhanced reasoning capabilities'},
        ],
        'alibaba': [
            {'id': 'qwq-plus', 'name': 'QwQ Plus', 'description': 'Alibaba\'s DashScope QwQ Plus model'},
            {'id': 'qwq', 'name': 'QwQ', 'description': 'Alibaba\'s DashScope QwQ model'},
            {'id': 'qwen-vl-plus', 'name': 'Qwen VL Plus', 'description': 'Alibaba\'s multimodal model for vision and language'},
            {'id': 'qwen-vl-max', 'name': 'Qwen VL Max', 'description': 'Alibaba\'s larger multimodal model for vision and language'},
        ],
    }
    
    def __init__(self):
        self.providers = {
            'openai': self._create_openai,
            'cohere': self._create_cohere,
            'huggingface': self._create_huggingface,
            'groq': self._create_groq,
            'mistral': self._create_mistral,
            'anthropic': self._create_anthropic,
            'xai': self._create_xai,
            'deepseek': self._create_deepseek,
            'alibaba': self._create_alibaba,
        }
    
    def get_available_models(self):
        """Return a dictionary of available models by provider"""
        return self.AVAILABLE_MODELS
    
    def get_llm(self, provider='openai', model_id=None, streaming=True):
        """Get an LLM instance based on the provider name and model_id"""
        if provider not in self.providers:
            raise ValueError(f"Provider {provider} not supported. Available providers: {list(self.providers.keys())}")
        
        # Set default models for each provider if none specified
        if model_id is None:
            default_models = {
                'openai': 'gpt-4o-mini',
                'huggingface': 'meta-llama/Llama-3.3-70B-Instruct',
                'deepseek': 'deepseek-chat',
                'xai': 'grok-2-latest',
                'anthropic': 'claude-3-5-haiku-latest',
                'groq': 'llama-3.3-70b-versatile',
                'cohere': 'command-r-plus-08-2024',
                'mistral': 'codestral-latest',
                'alibaba': 'qwq-plus'
            }
            model_id = default_models.get(provider, self.AVAILABLE_MODELS[provider][0]['id'])
            
        # Validate model_id
        valid_models = [model['id'] for model in self.AVAILABLE_MODELS[provider]]
        if model_id not in valid_models:
            logger.warning(f"Model {model_id} not found for provider {provider}. Using default model.")
            model_id = self.AVAILABLE_MODELS[provider][0]['id']
        
        try:
            return self.providers[provider](model_id=model_id, streaming=streaming)
        except Exception as e:
            logger.error(f"Error creating LLM for provider {provider}: {str(e)}")
            if provider != 'openai':
                logger.info(f"Falling back to OpenAI due to error with {provider}")
                return self.providers['openai'](model_id='gpt-4o-mini', streaming=streaming)
            else:
                raise
    
    def _create_openai(self, model_id='gpt-4o-mini', streaming=True):
        """Create an OpenAI LLM instance"""
        from flask import current_app
        api_key = current_app.config['OPENAI_API_KEY']
        
        if not api_key:
            raise ValueError("OpenAI API key not found. Please set OPENAI_API_KEY in your environment.")
        
        callbacks = [StreamingStdOutCallbackHandler()] if streaming else None
        
        return ChatOpenAI(
            openai_api_key=api_key,
            model_name=model_id,
            temperature=0.7,
            streaming=streaming,
            callbacks=callbacks
        )
    
    def _create_cohere(self, model_id='command-r-plus-08-2024', streaming=True):
        """Create a Cohere LLM instance"""
        from flask import current_app
        api_key = current_app.config.get('COHERE_API_KEY')
        
        if not api_key:
            raise ValueError("Cohere API key not found. Please set COHERE_API_KEY in your environment.")
        
        callbacks = [StreamingStdOutCallbackHandler()] if streaming else None
        
        try:
            # Use the new ClientV2 API with error handling
            client = cohere.ClientV2(api_key=api_key)
            
            # Test the connection by making a simple API call
            client.chat(
                model="command-light",  # Use a smaller model for testing
                messages=[{"role": "user", "content": "test"}],
                max_tokens=1
            )
            
            return CohereClientV2Wrapper(
                client=client,
                model=model_id,
                temperature=0.7,
                streaming=streaming,
                callbacks=callbacks
            )
        except Exception as e:
            logger.error(f"Error initializing Cohere client: {str(e)}")
            # Let the higher level error handling deal with this
            raise ValueError(f"Failed to initialize Cohere client: {str(e)}")
    
    def _create_huggingface(self, model_id='meta-llama/Llama-3.3-70B-Instruct', streaming=True):
        """Create a HuggingFace LLM instance"""
        from flask import current_app
        
        # Look for HF API key in config using both possible environment variable names
        api_key = current_app.config.get('HF_API_KEY') or current_app.config.get('HUGGINGFACE_API_KEY')
        
        if not api_key:
            raise ValueError("No HuggingFace API key found. Please set HF_API_KEY or HUGGINGFACE_API_KEY in your environment.")
        
        # HuggingFace doesn't support streaming in the same way
        streaming_arg = {} if not streaming else {"streaming": True}
        
        return HuggingFaceHub(
            repo_id=model_id,
            huggingfacehub_api_token=api_key,
            model_kwargs={"temperature": 0.7, **streaming_arg}
        )
    
    def _create_groq(self, model_id='llama-3.3-70b-versatile', streaming=True):
        """Create a Groq LLM instance"""
        from flask import current_app
        api_key = current_app.config.get('GROQ_API_KEY')
        
        if not api_key:
            raise ValueError("No Groq API key found. Please set GROQ_API_KEY in your environment.")
        
        callbacks = [StreamingStdOutCallbackHandler()] if streaming else None
        
        return GroqWrapper(
            api_key=api_key,
            model=model_id,
            temperature=0.7,
            streaming=streaming,
            callbacks=callbacks
        )
    
    def _create_mistral(self, model_id='codestral-latest', streaming=True):
        """Create a Mistral LLM instance"""
        from flask import current_app
        api_key = current_app.config.get('MISTRAL_API_KEY')
        
        if not api_key:
            raise ValueError("No Mistral API key found. Please set MISTRAL_API_KEY in your environment.")
        
        callbacks = [StreamingStdOutCallbackHandler()] if streaming else None
        
        return MistralWrapper(
            api_key=api_key,
            model=model_id,
            temperature=0.7,
            streaming=streaming,
            callbacks=callbacks
        )
    
    def _create_anthropic(self, model_id='claude-3-5-haiku-latest', streaming=True):
        """Create an Anthropic LLM instance"""
        from flask import current_app
        api_key = current_app.config.get('ANTHROPIC_API_KEY')
        
        if not api_key:
            raise ValueError("No Anthropic API key found. Please set ANTHROPIC_API_KEY in your environment.")
        
        callbacks = [StreamingStdOutCallbackHandler()] if streaming else None
        
        return AnthropicWrapper(
            api_key=api_key,
            model=model_id,
            temperature=0.7,
            streaming=streaming,
            callbacks=callbacks
        )
    
    def _create_xai(self, model_id='grok-2-latest', streaming=True):
        """Create an X AI (Grok) LLM instance"""
        from flask import current_app
        api_key = current_app.config.get('XAI_API_KEY')
        
        if not api_key:
            raise ValueError("No X AI (Grok) API key found. Please set XAI_API_KEY in your environment.")
        
        callbacks = [StreamingStdOutCallbackHandler()] if streaming else None
        
        return XaiWrapper(
            api_key=api_key,
            model=model_id,
            temperature=0.7,
            streaming=streaming,
            callbacks=callbacks
        )
    
    def _create_deepseek(self, model_id='deepseek-chat', streaming=True):
        """Create a Deepseek LLM instance"""
        from flask import current_app
        api_key = current_app.config.get('DEEPSEEK_API_KEY')
        
        if not api_key:
            raise ValueError("No Deepseek API key found. Please set DEEPSEEK_API_KEY in your environment.")
        
        callbacks = [StreamingStdOutCallbackHandler()] if streaming else None
        
        return DeepseekWrapper(
            api_key=api_key,
            model=model_id,
            temperature=0.7,
            streaming=streaming,
            callbacks=callbacks
        )
    
    def _create_alibaba(self, model_id='qwq-plus', streaming=True):
        """Create an Alibaba LLM instance"""
        from flask import current_app
        api_key = current_app.config.get('DASHSCOPE_API_KEY')
        
        if not api_key:
            raise ValueError("No Alibaba API key found. Please set DASHSCOPE_API_KEY in your environment.")
        
        callbacks = [StreamingStdOutCallbackHandler()] if streaming else None
        
        return AlibabaWrapper(
            api_key=api_key,
            model=model_id,
            temperature=0.7,
            streaming=streaming,
            callbacks=callbacks
        ) 