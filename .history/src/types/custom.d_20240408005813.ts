// src/types/express-session.d.ts
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: { githubId: string; id: string }; // Adjust according to the data you store in session
  }
}
