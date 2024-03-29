// src/types/github.ts

export interface AccessTokenData {
    access_token?: string;
    scope?: string;
    token_type?: string;
    error?: string;
  }
  
  export interface GitHubUserData {
    id: number;
    login: string;
    name?: string;
    html_url: string;
    avatar_url: string;
  }