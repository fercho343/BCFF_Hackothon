import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, Loader2, Zap } from 'lucide-react';
import { financialAI, VoiceAnalysisResult } from '@/lib/aiEnhanced';
import { useFinancialHabitsStore } from '@/stores/financialHabitsStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

// Type declarations for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
    webkitSpeechGrammarList: any;
    SpeechGrammarList: any;
  }
}

interface VoiceAssistantProps {
  className?: string;
  onTranscriptComplete?: (transcript: string, analysis: VoiceAnalysisResult) => void;
}

interface RealTimeResponse {
  text: string;
  confidence: number;
  isFinal: boolean;
}

export const VoiceAssistantRealTime: React.FC<VoiceAssistantProps> = ({ 
  className = '',
  onTranscriptComplete
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const [autoProcess, setAutoProcess] = useState(true);
  const [processingMode, setProcessingMode] = useState<'real-time' | 'final'>('real-time');
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { addHabit } = useFinancialHabitsStore();
  const { user } = useAuthStore();

  // Initialize speech recognition with enhanced configuration
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    // Enhanced configuration for real-time processing
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.maxAlternatives = 1;
    
    // Add financial vocabulary
    if (window.webkitSpeechGrammarList || window.SpeechGrammarList) {
      const SpeechGrammarList = window.webkitSpeechGrammarList || window.SpeechGrammarList;
      const grammarList = new SpeechGrammarList();
      const financialGrammar = '#JSGF V1.0; grammar financial; public <financial> = $ $dollars | budget | expense | income | save | spend | track | money | cost | price | amount;';
      grammarList.addFromString(financialGrammar, 1);
      recognitionRef.current.grammars = grammarList;
    }

    // Real-time interim results processing
    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';
      let currentInterim = '';
      let currentConfidence = 0;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const resultConfidence = result[0].confidence || 0;
        
        if (result.isFinal) {
          finalTranscript += transcript;
          currentConfidence = Math.max(currentConfidence, resultConfidence);
        } else {
          currentInterim += transcript;
        }
      }
      
      if (finalTranscript) {
        setTranscript(finalTranscript);
        setConfidence(currentConfidence);
        setInterimTranscript('');
        
        // Real-time processing for immediate feedback
        if (processingMode === 'real-time' && autoProcess) {
          if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
          }
          
          processingTimeoutRef.current = setTimeout(() => {
            processTranscript(finalTranscript);
          }, 1000); // 1 second delay for final processing
        }
      } else {
        setInterimTranscript(currentInterim);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      let errorMessage = 'Speech recognition error';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Audio capture failed. Please check your microphone.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please enable microphone permissions.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
      }
      
      toast.error(errorMessage);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        window.speechSynthesis.cancel();
      }
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, [processingMode, autoProcess]);

  const processTranscript = useCallback(async (transcriptText: string) => {
    if (!transcriptText.trim() || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      console.log('Processing transcript:', transcriptText);
      // Enhanced AI analysis with context
      const analysis = await financialAI.analyzeVoiceTranscript(transcriptText);
      
      console.log('AI Analysis result:', analysis);
      setLastResponse(analysis.response);
      
      // Call the callback if provided
      if (onTranscriptComplete) {
        onTranscriptComplete(transcriptText, analysis);
      }
      
      // Auto-create habits based on voice commands
      if (analysis.intent === 'expense' && analysis.extractedData?.amount && user) {
        const habitData = {
          userId: user.id,
          category: analysis.extractedData.category || 'General',
          amount: analysis.extractedData.amount,
          frequency: 'daily' as const,
          description: analysis.extractedData.description || transcriptText,
          isRecurring: false
        };
        
        addHabit(habitData);
        toast.success(`Expense tracked: $${analysis.extractedData.amount} for ${analysis.extractedData.category || 'General'}`);
      }
      
      // Speak the response
      speakResponse(analysis.response);
      
      // Show appropriate toast based on intent
      switch (analysis.intent) {
        case 'expense':
          toast.success('Expense recorded successfully!');
          break;
        case 'question':
          toast.success('Here\'s what I found for you');
          break;
        case 'budget':
          toast.success('Budget analysis complete');
          break;
        default:
          toast.success('Voice command processed');
      }
      
    } catch (error) {
      console.error('Error processing transcript:', error);
      console.error('Error details:', error.message, error.stack);
      toast.error('I\'m having trouble processing your request. Please try again.');
      
      // Fallback response
      const fallbackResponse = 'I\'m sorry, I\'m having trouble understanding. Could you please rephrase?';
      setLastResponse(fallbackResponse);
      speakResponse(fallbackResponse);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, user, addHabit]);

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      utterance.lang = 'en-US';
      
      // Use a more natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(voice => 
        voice.lang.includes('en') && 
        (voice.name.includes('Natural') || voice.name.includes('Google'))
      );
      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }
      
      synthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!isSupported) {
      toast.error('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (!recognitionRef.current) {
      toast.error('Speech recognition is not available. Please refresh the page.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript('');
      
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    } else {
      setTranscript('');
      setInterimTranscript('');
      setConfidence(0);
      setLastResponse('');
      
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.success('Listening... Speak now!');
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast.error('Failed to start speech recognition. Please try again.');
      }
    }
  };

  const manualProcess = () => {
    if (transcript.trim() && !isProcessing) {
      processTranscript(transcript);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
    setLastResponse('');
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">AI Voice Assistant</h3>
          <p className="text-sm text-gray-500">Real-time financial voice commands</p>
        </div>
        <div className="flex items-center space-x-2">
          {!isListening && (
            <>
              <button
                onClick={() => setProcessingMode(processingMode === 'real-time' ? 'final' : 'real-time')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  processingMode === 'real-time' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}
                title={processingMode === 'real-time' ? 'Real-time mode' : 'Final mode'}
              >
                <Zap size={12} className="inline mr-1" />
                {processingMode === 'real-time' ? 'Real-time' : 'Final'}
              </button>
              <button
                onClick={() => setAutoProcess(!autoProcess)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  autoProcess 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}
                title="Auto-process voice commands"
              >
                Auto
              </button>
            </>
          )}
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
      </div>

      {/* Real-time transcript display */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500">Voice Input:</p>
          {confidence > 0 && (
            <span className="text-xs text-gray-400">
              Confidence: {Math.round(confidence * 100)}%
            </span>
          )}
        </div>
        <div className="bg-gray-50 rounded-lg p-3 min-h-[60px] relative">
          {transcript && (
            <p className="text-gray-800">{transcript}</p>
          )}
          {interimTranscript && (
            <p className="text-gray-400 italic">{interimTranscript}</p>
          )}
          {!transcript && !interimTranscript && (
            <p className="text-gray-400 text-sm">Start speaking to see your words here...</p>
          )}
          {isListening && !transcript && !interimTranscript && (
            <div className="flex items-center space-x-2 text-blue-500">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Listening...</span>
            </div>
          )}
        </div>
      </div>

      {/* Processing controls */}
      <div className="flex items-center space-x-2 mb-4">
        <button
          onClick={manualProcess}
          disabled={!transcript.trim() || isProcessing}
          className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
        >
          Process Now
        </button>
        <button
          onClick={clearTranscript}
          disabled={!transcript && !interimTranscript}
          className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
        >
          Clear
        </button>
        {isProcessing && (
          <div className="flex items-center space-x-2 text-blue-500">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Processing with AI...</span>
          </div>
        )}
      </div>

      {/* AI Response */}
      {lastResponse && !isProcessing && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">AI Response:</p>
            <button
              onClick={() => speakResponse(lastResponse)}
              className="text-blue-500 hover:text-blue-600 p-1"
              title="Repeat response"
            >
              <Volume2 size={16} />
            </button>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-gray-800">{lastResponse}</p>
          </div>
        </div>
      )}

      {/* Enhanced command examples */}
      <div className="text-xs text-gray-500">
        <p className="font-medium mb-2">Try these voice commands:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <p className="font-medium text-gray-600">Expense Tracking:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>"I spent $50 on groceries today"</li>
              <li>"Track $25 for lunch"</li>
              <li>"Add $100 for gas this week"</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-600">Financial Questions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>"What's my budget for dining out?"</li>
              <li>"How can I save more money?"</li>
              <li>"Give me budgeting tips"</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Support status */}
      {!isSupported && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            <strong>Browser not supported:</strong> Please use Chrome, Edge, or Safari for voice recognition features.
          </p>
        </div>
      )}
    </div>
  );
};