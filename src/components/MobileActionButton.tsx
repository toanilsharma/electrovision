import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface MobileActionButtonProps {
  children: React.ReactNode;
}

export function MobileActionButton({ children }: MobileActionButtonProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Wait for next tick to ensure App has rendered it
    setTimeout(() => {
      setContainer(document.getElementById('mobile-action-container'));
    }, 0);
  }, []);

  if (!container) return null;

  return createPortal(
    <div className="pointer-events-auto w-full drop-shadow-2xl">
      {children}
    </div>,
    container
  );
}
