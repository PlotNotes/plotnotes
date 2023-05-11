import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Router from 'next/router'
import { deleteExpiredSessions } from './api/sessionCmds'
import React from 'react'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <Component {...pageProps} />
    </GoogleOAuthProvider>
  );
}
