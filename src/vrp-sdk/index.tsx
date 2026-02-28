import { createContext, ReactNode } from 'react';

const VRPContext = createContext<any>(null);

export function VRPProvider({ children }: { children: ReactNode }) {
  return <VRPContext.Provider value={{}}>{children}</VRPContext.Provider>;
}

export function useUser() {
  return { userId: 'demo-user', username: 'DemoUser', avatarUrl: null };
}

export function useContext() {
  return { contextId: 'demo-context', type: 'app', members: [] };
}

export function usePost() {
  return null;
}

export function useSocial() {
  return {
    createPost: async (data: any) => console.log('Create post:', data),
    sharePost: async (postId: string) => console.log('Share post:', postId),
    invite: async (userId: string) => console.log('Invite:', userId),
  };
}

export function useStorage() {
  return {
    get: async (key: string) => {
      const value = localStorage.getItem(`vrp:${key}`);
      return value ? JSON.parse(value) : null;
    },
    set: async (key: string, value: any) => {
      localStorage.setItem(`vrp:${key}`, JSON.stringify(value));
    },
    remove: async (key: string) => {
      localStorage.removeItem(`vrp:${key}`);
    },
    getMany: async (keys: string[]) => {
      return keys.map(key => {
        const value = localStorage.getItem(`vrp:${key}`);
        return value ? JSON.parse(value) : null;
      });
    },
    setMany: async (items: Array<{ key: string; value: any }>) => {
      items.forEach(({ key, value }) => {
        localStorage.setItem(`vrp:${key}`, JSON.stringify(value));
      });
    },
  };
}

export function useFiles() {
  return {
    upload: async (file: File) => {
      console.log('Upload file:', file);
      return { url: URL.createObjectURL(file), fileId: 'demo-file-id' };
    },
  };
}

export function useAI() {
  return {
    generateText: async (_prompt: string) => 'AI response',
    streamText: async function* (_prompt: string) {
      yield 'AI ';
      yield 'streaming ';
      yield 'response';
    },
    generateSpeech: async (_text: string) => new Blob(),
    transcribe: async (_audio: Blob) => 'Transcription',
    generateImage: async (_prompt: string) => 'image-url',
    getCredits: async () => ({ remaining: 100, total: 100 }),
  };
}

export function useMedia() {
  return {
    takePhoto: async () => new Blob(),
    recordVideo: async () => new Blob(),
    recordAudio: async () => new Blob(),
    pickFromGallery: async () => new Blob(),
  };
}

export function useAnalytics() {
  return {
    track: (event: string, properties?: any) => {
      console.log('Track event:', event, properties);
    },
  };
}

export function useNavigation() {
  return {
    openApp: (appId: string) => console.log('Open app:', appId),
    openPost: (postId: string) => console.log('Open post:', postId),
    back: () => console.log('Navigate back'),
  };
}
