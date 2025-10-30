import React, { useEffect, useRef } from 'react';

type YandexAdProps = {
  blockId: string;
  id: string;
};

export function YandexAd({ blockId, id }: YandexAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure Yandex context script is loaded
    if (!window.yaContextCb) {
      (window as any).yaContextCb = [];
    }

    const container = containerRef.current;
    if (!container) return;

    // Render ad when Ya.Context is ready
    const renderAd = () => {
      if ((window as any).Ya?.Context?.AdvManager && container) {
        try {
          (window as any).Ya.Context.AdvManager.render({
            blockId,
            renderTo: id,
          });
        } catch (err) {
          console.warn('Failed to render Yandex ad:', err);
        }
      }
    };

    // If Ya.Context is already available, render immediately
    if ((window as any).Ya?.Context?.AdvManager) {
      renderAd();
    } else {
      // Otherwise, wait for it via yaContextCb
      (window as any).yaContextCb.push(renderAd);
    }

    return () => {
      // Cleanup on unmount
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [blockId, id]);

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

