// custom-types.d.ts
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: { githubId: string; id: string }; // Adjust according to your user object structure
  }
}
