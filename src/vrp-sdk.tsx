import { createContext, ReactNode } from 'react';

// Mock VRP SDK for development
const VRPContext = createContext({});

export function VRPProvider({ children }: { children: ReactNode }) {
  return <VRPContext.Provider value={{}}>{children}</VRPContext.Provider>;
}

export function useUser() {
  return { userId: 'mock-user', username: 'Player', avatarUrl: null };
}

export function useContext() {
  return { contextId: 'mock-context', type: 'CHAT', members: [] };
}

export function usePost() {
  return null;
}

export function useSocial() {
  return {
    createPost: async (params: any) => console.log('Create post:', params),
    sharePost: async (postId: string) => console.log('Share post:', postId),
    invite: async (userIds: string[]) => console.log('Invite:', userIds),
  };
}

export function useStorage() {
  return {
    get: async (key: string) => {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    },
    set: async (key: string, value: any) => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    remove: async (key: string) => {
      localStorage.removeItem(key);
    },
    getMany: async (keys: string[]) => {
      const result: Record<string, any> = {};
      keys.forEach(key => {
        const val = localStorage.getItem(key);
        result[key] = val ? JSON.parse(val) : null;
      });
      return result;
    },
    setMany: async (items: Record<string, any>) => {
      Object.entries(items).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
    },
  };
}

export function useFiles() {
  return {
    upload: async (file: File) => {
      console.log('Upload file:', file.name);
      return 'mock-file-url';
    },
  };
}

export function useAI() {
  return {
    generateText: async (prompt: string) => {
      console.log('Generate text:', prompt);
      return 'AI response';
    },
    streamText: async function* (prompt: string) {
      console.log('Stream text:', prompt);
      yield 'AI ';
      yield 'response';
    },
    generateSpeech: async (text: string) => {
      console.log('Generate speech:', text);
      return 'mock-audio-url';
    },
    transcribe: async (audioUrl: string) => {
      console.log('Transcribe:', audioUrl);
      return 'Transcription';
    },
    generateImage: async (prompt: string) => {
      console.log('Generate image:', prompt);
      return 'mock-image-url';
    },
    getCredits: async () => {
      return { remaining: 100, total: 100 };
    },
  };
}

export function useMedia() {
  return {
    takePhoto: async () => {
      console.log('Take photo');
      return 'mock-photo-url';
    },
    recordVideo: async () => {
      console.log('Record video');
      return 'mock-video-url';
    },
    recordAudio: async () => {
      console.log('Record audio');
      return 'mock-audio-url';
    },
    pickFromGallery: async () => {
      console.log('Pick from gallery');
      return ['mock-media-url'];
    },
  };
}

export function useAnalytics() {
  return {
    track: async (event: string, properties?: Record<string, any>) => {
      console.log('Track event:', event, properties);
    },
  };
}

export function useNavigation() {
  return {
    openApp: async (appId: string) => {
      console.log('Open app:', appId);
    },
    openPost: async (postId: string) => {
      console.log('Open post:', postId);
    },
    back: async () => {
      console.log('Navigate back');
    },
  };
}
