import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { financialAI } from '@/lib/ai';
import { toast } from 'sonner';

// Type declarations for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface VoiceAssistantProps {
  onTranscriptComplete?: (transcript: string, analysis: {
    intent: string;
    extractedData?: {
      amount?: number;
      category?: string;
      description?: string;
      date?: string;
    };
    response: string;
  }) => void;
  className?: string;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
  onTranscriptComplete, 
  className = '' 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        const transcriptText = event.results[0][0].transcript;
        setTranscript(transcriptText);
        setIsListening(false);
        
        // Process the transcript with AI
        await processTranscript(transcriptText);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Speech recognition error. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const processTranscript = async (transcriptText: string) => {
    setIsProcessing(true);
    
    try {
      // Analyze the transcript with AI
      const analysis = await financialAI.analyzeVoiceTranscript(transcriptText);
      
      setLastResponse(analysis.response);
      
      // Speak the response
      speakResponse(analysis.response);
      
      // Notify parent component
      if (onTranscriptComplete) {
        onTranscriptComplete(transcriptText, analysis);
      }
      
      // Show toast notification
      toast.success('Voice command processed successfully');
      
    } catch (error) {
      console.error('Error processing transcript:', error);
      toast.error('Error processing voice command');
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      synthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Voice Assistant</h3>
        <button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`p-3 rounded-full transition-all duration-200 ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isListening ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
      </div>

      {transcript && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">You said:</p>
          <p className="text-gray-800 bg-gray-100 p-3 rounded-lg">{transcript}</p>
        </div>
      )}

      {isProcessing && (
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <p className="text-sm text-gray-600">Processing your request...</p>
          </div>
        </div>
      )}

      {lastResponse && !isProcessing && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-500">Assistant response:</p>
            <button
              onClick={() => speakResponse(lastResponse)}
              className="text-blue-500 hover:text-blue-600 p-1"
            >
              <Volume2 size={16} />
            </button>
          </div>
          <p className="text-gray-800 bg-blue-50 p-3 rounded-lg">{lastResponse}</p>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>Try saying:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>"I spent $50 on groceries today"</li>
          <li>"What's my budget for dining out?"</li>
          <li>"How can I save more money?"</li>
          <li>"Track my coffee expenses"</li>
        </ul>
      </div>
    </div>
  );
};