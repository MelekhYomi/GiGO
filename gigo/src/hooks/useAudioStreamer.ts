import { useState, useRef } from 'react';

export const useAudioStreamer = (backendUrl: string) => {
  const [isRecording, setIsRecording] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [extractedData, setExtractedData] = useState<any>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startStreaming = async () => {
    audioChunksRef.current = [];
    setProcessingStatus('Requesting mic access...');
    setExtractedData(null);

    try {
      // Capture the user's native vocal input stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize the recorder targeting standard lightweight audio containers
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      // Every time raw audio data becomes available, collect it in the local memory buffer
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // When recording stops, compile all raw chunks and fire the payload straight to Gemini
      mediaRecorder.onstop = async () => {
        setProcessingStatus('Compiling voice layers and invoking GiGO Brain...');
        
        const completeAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Bundle into a standard multi-part form payload
        const formData = new FormData();
        formData.append('voice_chunk', completeAudioBlob, 'native_clip.wav');

        try {
          const response = await fetch(`${backendUrl}/api/test/process-native-voice`, {
            method: 'POST',
            body: formData, // Browser handles multi-part boundaries automatically
          });

          const result = await response.json();
          if (result.success) {
            setExtractedData(result.extractedPayload);
            setProcessingStatus('Profile fully optimized and committed to Firestore!');
          } else {
            setProcessingStatus(`Processing error: ${result.error}`);
          }
        } catch (err: any) {
          setProcessingStatus(`Network failure: ${err.message}`);
        } finally {
          // Clean up microphone hardware streams
          stream.getTracks().forEach(track => track.stop());
        }
      };

      // Start recording and slice the audio into data drops every 2000ms
      mediaRecorder.start(2000);
      setIsRecording(true);
      setProcessingStatus('GiGO is actively listening to your voice profile...');
    } catch (err: any) {
      setProcessingStatus(`Mic Access Denied: ${err.message}`);
      setIsRecording(false);
    }
  };

  const stopStreaming = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return {
    isRecording,
    processingStatus,
    extractedData,
    startStreaming,
    stopStreaming
  };
};
