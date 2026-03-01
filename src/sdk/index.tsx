import { createContext, ReactNode } from "react";

// Types
export interface User {
  userId: string;
  username: string;
  avatarUrl: string;
}

export interface VRPContext {
  contextId: string;
  type: "dm" | "group" | "channel";
  members?: string[];
}

export interface PostConfig {
  config: any;
}

// Mock implementations for development
const VRPContextValue = createContext<any>(null);

export function VRPProvider({ children }: { children: ReactNode }) {
  return <VRPContextValue.Provider value={{}}>{children}</VRPContextValue.Provider>;
}

export function useUser(): User | null {
  // Mock user for development
  return {
    userId: "user123",
    username: "Player",
    avatarUrl: "https://example.com/avatar.png",
  };
}

export function useContext(): VRPContext {
  return {
    contextId: "ctx123",
    type: "dm",
  };
}

export function usePost(): PostConfig | null {
  return null;
}

export function useSocial() {
  return {
    createPost: async ({ config }: { config: any }) => {
      console.log("Creating post with config:", config);
    },
    sharePost: async (postId: string) => {
      console.log("Sharing post:", postId);
    },
    invite: async (userIds: string[]) => {
      console.log("Inviting users:", userIds);
    },
  };
}

export function useStorage() {
  return {
    get: async (key: string): Promise<string | null> => {
      return localStorage.getItem(key);
    },
    set: async (key: string, value: string): Promise<void> => {
      localStorage.setItem(key, value);
    },
    remove: async (key: string): Promise<void> => {
      localStorage.removeItem(key);
    },
    getMany: async (keys: string[]): Promise<Record<string, string | null>> => {
      const result: Record<string, string | null> = {};
      keys.forEach((key) => {
        result[key] = localStorage.getItem(key);
      });
      return result;
    },
    setMany: async (items: Record<string, string>): Promise<void> => {
      Object.entries(items).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    },
  };
}

export function useFiles() {
  return {
    upload: async (file: File): Promise<string> => {
      console.log("Uploading file:", file.name);
      return "mock-file-url";
    },
  };
}

export function useAI() {
  return {
    generateText: async (_prompt: string): Promise<string> => {
      throw new Error("AI features not available in mock SDK");
    },
    streamText: async function* (_prompt: string): AsyncGenerator<string> {
      throw new Error("AI features not available in mock SDK");
    },
    generateSpeech: async (_text: string): Promise<string> => {
      throw new Error("AI features not available in mock SDK");
    },
    transcribe: async (_audioUrl: string): Promise<string> => {
      throw new Error("AI features not available in mock SDK");
    },
    generateImage: async (_prompt: string): Promise<string> => {
      throw new Error("AI features not available in mock SDK");
    },
    getCredits: async (): Promise<number> => {
      return 1000;
    },
  };
}

export function useMedia() {
  return {
    takePhoto: async (): Promise<string> => {
      console.log("Taking photo");
      return "mock-photo-url";
    },
    recordVideo: async (): Promise<string> => {
      console.log("Recording video");
      return "mock-video-url";
    },
    recordAudio: async (): Promise<string> => {
      console.log("Recording audio");
      return "mock-audio-url";
    },
    pickFromGallery: async (): Promise<string> => {
      console.log("Picking from gallery");
      return "mock-image-url";
    },
  };
}

export function useAnalytics() {
  return {
    track: ({ event, properties }: { event: string; properties?: any }) => {
      console.log("Analytics event:", event, properties);
    },
  };
}

export function useNavigation() {
  return {
    openApp: (appId: string) => {
      console.log("Opening app:", appId);
    },
    openPost: (postId: string) => {
      console.log("Opening post:", postId);
    },
    back: () => {
      console.log("Going back");
    },
  };
}
