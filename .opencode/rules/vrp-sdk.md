# VRP SDK Rules

You are building a mini-app for the VRP (Vibe Runtime Platform). Follow these rules strictly.

## Project Structure

Every VRP app must have this structure:

```
package.json
index.html
src/
  main.tsx      — entry point, renders App inside VRPProvider
  App.tsx       — main app component
  components/   — additional components
```

The build output goes to `dist/` via esbuild. Do not modify `dist/` directly.

## SDK Usage

Import hooks from `@vrp/sdk`:

```tsx
import { useUser, usePost, useSocial, useAI, useStorage, useMedia, useAnalytics, useFiles, useContext, useNavigation, VRPProvider } from "@vrp/sdk"
```

The app must be wrapped in `<VRPProvider>`:

```tsx
import { VRPProvider } from "@vrp/sdk"

function App() {
  return (
    <VRPProvider>
      <MyApp />
    </VRPProvider>
  )
}
```

## Available Hooks

- `useUser()` — returns `{ userId, username, avatarUrl }` or `null`
- `useContext()` — returns `{ contextId, type, members }`
- `usePost()` — returns post config if in POST context, or `null`
- `useSocial()` — `{ createPost, sharePost, invite }`
- `useStorage()` — `{ get, set, remove, getMany, setMany }`
- `useFiles()` — `{ upload }` for media files (images, audio, video)
- `useAI()` — `{ generateText, streamText, generateSpeech, transcribe, generateImage, getCredits }`
- `useMedia()` — `{ takePhoto, recordVideo, recordAudio, pickFromGallery }`
- `useAnalytics()` — `{ track }`
- `useNavigation()` — `{ openApp, openPost, back }`

## Sandbox Constraints

VRP apps run inside a sandboxed WebView. You MUST NOT:

- Use `fetch()` or `XMLHttpRequest` directly
- Open WebSocket connections directly
- Access `document.cookie` for cross-origin purposes
- Use `window.open()` or `window.location` to navigate away
- Access the filesystem

All network and device access must go through the SDK hooks listed above. There are no exceptions.

## Post Config

When creating a post with `useSocial().createPost({ config })`, the config must be a plain JSON-serializable object. The app reads config via `usePost()?.config` to customize its behavior.

## Styling

Use inline styles or CSS modules. The app runs full-screen inside a mobile WebView with system chrome above and below. Design for mobile-first (portrait, ~390px wide).

## Error Handling

All async SDK methods can throw errors with `{ code, message }`. Handle `CREDITS_EXHAUSTED` gracefully — show the user a message that they're out of AI credits.
