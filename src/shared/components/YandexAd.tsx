import React, { useEffect, useRef, useState } from 'react';

type YandexAdProps = {
  blockId: string;
  id: string;
  onError?: (hasError: boolean) => void;
};

export function YandexAd({ blockId, id, onError }: YandexAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Ensure Yandex context script is loaded
    if (!window.yaContextCb) {
      (window as any).yaContextCb = [];
    }

    const container = containerRef.current;
    if (!container) return;

    let timeoutId: number | undefined;
    let checkContentId: number | undefined;
    const ERROR_TIMEOUT = 5000; // 5 seconds timeout to detect if AdvManager never loads
    const CONTENT_CHECK_DELAY = 3000; // 3 seconds to check if ad content appeared

    // Check if ad content actually appeared in the container
    const checkAdContent = () => {
      if (!container) return;
      
      // Check if container has any meaningful content (children or iframe)
      const hasContent = container.children.length > 0 || 
                        container.querySelector('iframe') !== null ||
                        container.innerHTML.trim().length > 0;
      
      if (!hasContent) {
        // No content appeared, likely an error
        console.warn('Yandex ad did not render content - hiding ad container');
        setHasError(true);
        onError?.(true);
      }
    };

    // Listen for errors related to Yandex ads
    const handleError = (event: ErrorEvent | Event) => {
      let errorMessage = '';
      
      if (event instanceof ErrorEvent) {
        errorMessage = event.message || event.error?.message || '';
      } else if (event.target) {
        const target = event.target as any;
        errorMessage = target.src || target.href || '';
      }
      
      const errorString = typeof errorMessage === 'string' ? errorMessage : String(errorMessage);
      
      if (errorString.includes('PAGE_NOT_FOUND') ||
          errorString.includes('17605551') ||
          errorString.includes('yandex.ru/ads') ||
          errorString.includes('Failed to load resource')) {
        console.warn('Yandex ad error detected:', errorString);
        setHasError(true);
        onError?.(true);
      }
    };

    // Listen for script/network errors
    window.addEventListener('error', handleError, true);

    // Render ad when Ya.Context is ready
    const renderAd = () => {
      // Clear timeout since we're trying to render now
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }

      if ((window as any).Ya?.Context?.AdvManager && container) {
        try {
          (window as any).Ya.Context.AdvManager.render({
            blockId,
            renderTo: id,
          });
          
          // Set up a check to see if content actually appeared
          checkContentId = window.setTimeout(checkAdContent, CONTENT_CHECK_DELAY);
        } catch (err) {
          console.warn('Failed to render Yandex ad:', err);
          setHasError(true);
          onError?.(true);
        }
      } else {
        // AdvManager not available even though Ya.Context is ready
        setHasError(true);
        onError?.(true);
      }
    };

    // If Ya.Context is already available, render immediately
    if ((window as any).Ya?.Context?.AdvManager) {
      renderAd();
    } else {
      // Otherwise, wait for it via yaContextCb
      (window as any).yaContextCb.push(renderAd);
      
      // Set a timeout to detect if AdvManager never loads
      timeoutId = window.setTimeout(() => {
        if (!(window as any).Ya?.Context?.AdvManager) {
          console.warn('Yandex AdvManager did not load within timeout');
          setHasError(true);
          onError?.(true);
        }
      }, ERROR_TIMEOUT);
    }

    return () => {
      // Cleanup on unmount
      window.removeEventListener('error', handleError, true);
      if (container) {
        container.innerHTML = '';
      }
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      if (checkContentId !== undefined) {
        clearTimeout(checkContentId);
      }
    };
  }, [blockId, id]);

  // Don't render the container if there's an error
  if (hasError) {
    return null;
  }

  return <div id={id} ref={containerRef} />;
}

declare global {
  interface Window {
    yaContextCb?: Array<() => void>;
    Ya?: {
      Context?: {
        AdvManager?: {
          render: (config: { blockId: string; renderTo: string }) => void;
        };
      };
    };
  }
}

