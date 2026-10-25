'use client';

// Token management utilities
import { useEffect, useSyncExternalStore } from 'react';

const AUTH_EVENT = 'evaluatorai-auth-change';

const notifyAuthChange = () => window.dispatchEvent(new Event(AUTH_EVENT));

export const saveToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
    notifyAuthChange();
  }
};

export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    notifyAuthChange();
  }
};

export const saveUser = (user: unknown) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

const subscribeAuth = (callback: () => void) => {
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener('storage', callback);  // Login/logout in another tab
  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
};

const noopSubscribe = () => () => {};

// True in the browser, false while rendering on the server (avoids hydration mismatches)
export const useIsClient = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

// Whether a user is logged in; updates on login and logout
export const useIsLoggedIn = () => useSyncExternalStore(subscribeAuth, isAuthenticated, () => false);

// Titles requested by mounted components; the most recent one wins
const titleStack: string[] = [];
let titleObserver: MutationObserver | null = null;

const applyTitle = () => {
  const wanted = titleStack[titleStack.length - 1];
  if (wanted && document.title !== wanted) document.title = wanted;
};

// Sets the browser tab title, e.g. "Tests · EvaluatorAI". Next.js streams the site-wide <title>
// into the page after it loads, so one shared observer re-applies the title whenever <title> changes.
export const usePageTitle = (title: string | null | undefined) => {
  useEffect(() => {
    const wanted = title ? `${title} · EvaluatorAI` : 'EvaluatorAI · Free AI test generator for candidate screening';
    titleStack.push(wanted);
    if (!titleObserver) {
      titleObserver = new MutationObserver(applyTitle);
      titleObserver.observe(document.head, { subtree: true, childList: true, characterData: true });
    }
    applyTitle();
    return () => {
      titleStack.splice(titleStack.lastIndexOf(wanted), 1);
      if (titleStack.length === 0) {
        titleObserver?.disconnect();
        titleObserver = null;
      } else {
        applyTitle();
      }
    };
  }, [title]);
};
