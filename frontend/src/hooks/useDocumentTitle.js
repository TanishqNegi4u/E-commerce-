// IMP-2 FIX: useDocumentTitle hook to set per-page browser tab titles
// Improves SEO and UX when users have multiple tabs open.
import { useEffect } from 'react';

export default function useDocumentTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — ShopWave` : 'ShopWave';
    return () => { document.title = prev; };
  }, [title]);
}