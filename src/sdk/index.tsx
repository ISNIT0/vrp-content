import { createContext, useContext as useReactContext, ReactNode } from "react";

// Types
export interface User {
  userId: string;
  username: string;
  avatarUrl: string;
}

export interface Context {
  contextId: string;
  type: string;
  members: string[];
}

export interface Post {
  config: any;
}

export interface Social {
  createPost: (params: { config: any }) => Promise<void>;
  sharePost: (postId: string) => Promise<void>;
  invite: (userId: string) => Promise<void>;
}

export interface Storage {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  remove: (key: string) => Promise<void>;
  getMany: (keys: string[]) => Promise<Record<string, any>>;
  setMany: (values: Record<string, any>) => Promise<void>;
}

export interface Files {
  upload: (file: File) => Promise<string>;
}

export interface AI {
  generateText: (prompt: string) => Promise<string>;
  streamText: (prompt: string) => AsyncIterable<string>;
  generateSpeech: (text: string) => Promise<string>;
  transcribe: (audioUrl: string) => Promise<string>;
  generateImage: (prompt: string) => Promise<string>;
  getCredits: () => Promise<number>;
}

export interface Media {
  takePhoto: () => Promise<string>;
  recordVideo: () => Promise<string>;
  recordAudio: () => Promise<string>;
  pickFromGallery: () => Promise<string>;
}

export interface Analytics {
  track: (event: string, properties?: Record<string, any>) => void;
}

export interface Navigation {
  openApp: (appId: string) => void;
  openPost: (postId: string) => void;
  back: () => void;
}

// Context
const VRPContext = createContext<any>(null);

// Rename React's useContext to avoid conflicts
const useReactContextInternal = useReactContext;

// Provider
export function VRPProvider({ children }: { children: ReactNode }) {
  // Mock storage using localStorage
  const storage: Storage = {
    get: async (key: string) => {
      const value = localStorage.getItem(`vrp_${key}`);
      return value ? JSON.parse(value) : null;
    },
    set: async (key: string, value: any) => {
      localStorage.setItem(`vrp_${key}`, JSON.stringify(value));
    },
    remove: async (key: string) => {
      localStorage.removeItem(`vrp_${key}`);
    },
    getMany: async (keys: string[]) => {
      const result: Record<string, any> = {};
      keys.forEach(key => {
        const value = localStorage.getItem(`vrp_${key}`);
        result[key] = value ? JSON.parse(value) : null;
      });
      return result;
    },
    setMany: async (values: Record<string, any>) => {
      Object.entries(values).forEach(([key, value]) => {
        localStorage.setItem(`vrp_${key}`, JSON.stringify(value));
      });
    }
  };

  const analytics: Analytics = {
    track: (event: string, properties?: Record<string, any>) => {
      console.log('[Analytics]', event, properties);
    }
  };

  const user: User = {
    userId: 'demo-user',
    username: 'Demo User',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo'
  };

  const contextValue = {
    storage,
    analytics,
    user
  };

  return (
    <VRPContext.Provider value={contextValue}>
      {children}
    </VRPContext.Provider>
  );
}

// Hooks
export function useUser(): User | null {
  const context = useReactContextInternal(VRPContext);
  return context?.user || null;
}

export function useContext(): Context | null {
  return null;
}

export function usePost(): Post | null {
  return null;
}

export function useSocial(): Social {
  return {
    createPost: async () => {},
    sharePost: async () => {},
    invite: async () => {}
  };
}

export function useStorage(): Storage {
  const context = useReactContextInternal(VRPContext);
  return context?.storage;
}

export function useFiles(): Files {
  return {
    upload: async () => ''
  };
}

export function useAI(): AI {
  return {
    generateText: async () => '',
    streamText: async function* () {},
    generateSpeech: async () => '',
    transcribe: async () => '',
    generateImage: async () => '',
    getCredits: async () => 100
  };
}

export function useMedia(): Media {
  return {
    takePhoto: async () => '',
    recordVideo: async () => '',
    recordAudio: async () => '',
    pickFromGallery: async () => ''
  };
}

export function useAnalytics(): Analytics {
  const context = useReactContextInternal(VRPContext);
  return context?.analytics;
}

export function useNavigation(): Navigation {
  return {
    openApp: () => {},
    openPost: () => {},
    back: () => {}
  };
}
