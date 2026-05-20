import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAude_CODE_OAUTH_TOKEN!,
});

export interface TranscriptionResult {
  text: string;
  metadata: {
    duration: number;
    timestamp: string;
    model: string;
  };
}

export async function transcribeVideo(videoUrl: string): Promise<TranscriptionResult> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Please transcribe this video. The video is available at: ${videoUrl}
        
Return ONLY a JSON object with this exact structure:
{
  "text": "the full transcription text here",
  "metadata": {
    "duration": 0,
    "timestamp": "ISO timestamp",
    "model": "claude-3-7-sonnet-20250219"
  }
}

If you cannot access the video content, return an error message in the text field.`,
      }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Try to parse JSON response
    let transcription: TranscriptionResult;
    try {
      transcription = JSON.parse(responseText);
    } catch {
      // Fallback if not JSON
      transcription = {
        text: responseText,
        metadata: {
          duration: 0,
          timestamp: new Date().toISOString(),
          model: 'claude-3-7-sonnet-20250219'
        }
      };
    }

    return transcription;
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe video');
  }
}

export async function generateMetadata(videoBlob: Blob, title?: string) {
  const metadata = {
    title: title || `Recording ${new Date().toLocaleString()}`,
    createdAt: new Date().toISOString(),
    size: videoBlob.size,
    type: videoBlob.type,
    duration: 0, // Will be updated during transcription
  };
  
  return metadata;
}