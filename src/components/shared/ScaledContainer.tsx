import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface ScaledContainerProps {
  children: ReactNode;
  designWidth?: number;
  designHeight?: number;
}

const ScaledContainer = ({ 
  children, 
  designWidth = 2560, 
  designHeight = 1440 
}: ScaledContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      // 使用视口尺寸
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // 计算缩放比例，保持宽高比
      const scaleX = viewportWidth / designWidth;
      const scaleY = viewportHeight / designHeight;
      const newScale = Math.min(scaleX, scaleY);
      
      setScale(newScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    
    // 禁止body滚动
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('resize', updateScale);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [designWidth, designHeight]);

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: designWidth,
          height: designHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          backgroundColor: '#fff',
          boxShadow: scale < 1 ? '0 0 20px rgba(0,0,0,0.1)' : 'none',
          flexShrink: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ScaledContainer;
