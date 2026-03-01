import { createContext, ReactNode } from "react";

// Mock VRP SDK for development
const VRPContext = createContext<any>(null);

export function VRPProvider({ children }: { children: ReactNode }) {
  return <VRPContext.Provider value={{}}>{children}</VRPContext.Provider>;
}

export function useStorage() {
  return {
    get: async (key: string) => {
      const value = localStorage.getItem(key);
      return value;
    },
    set: async (key: string, value: string) => {
      localStorage.setItem(key, value);
    },
    remove: async (key: string) => {
      localStorage.removeItem(key);
    },
    getMany: async (keys: string[]) => {
      const result: Record<string, string | null> = {};
      keys.forEach(key => {
        result[key] = localStorage.getItem(key);
      });
      return result;
    },
    setMany: async (items: Record<string, string>) => {
      Object.entries(items).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    },
  };
}

export function useAnalytics() {
  return {
    track: (event: string, data?: any) => {
      console.log("Analytics:", event, data);
    },
  };
}

export function useUser() {
  return { userId: "demo", username: "DemoUser", avatarUrl: null };
}

export function useContext() {
  return { contextId: "demo", type: "standalone", members: [] };
}

export function usePost() {
  return null;
}

export function useSocial() {
  return {
    createPost: async (config: any) => console.log("Create post:", config),
    sharePost: async (postId: string) => console.log("Share post:", postId),
    invite: async (userIds: string[]) => console.log("Invite:", userIds),
  };
}

export function useFiles() {
  return {
    upload: async (file: File) => {
      console.log("Upload file:", file.name);
      return { url: URL.createObjectURL(file), id: "mock-id" };
    },
  };
}

export function useAI() {
  return {
    generateText: async (_prompt: string) => "Mock AI response",
    streamText: async function* (_prompt: string) {
      yield "Mock ";
      yield "streaming ";
      yield "response";
    },
    generateSpeech: async (_text: string) => new Blob(),
    transcribe: async (_audio: Blob) => "Mock transcription",
    generateImage: async (_prompt: string) => "data:image/png;base64,mock",
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

export function useNavigation() {
  return {
    openApp: (appId: string) => console.log("Open app:", appId),
    openPost: (postId: string) => console.log("Open post:", postId),
    back: () => console.log("Navigate back"),
  };
}
