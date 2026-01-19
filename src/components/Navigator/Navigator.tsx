import { useState, useEffect } from 'react';
import { SectionPanel, Divider } from '../shared';
import ListItem from './ListItem';
import navigatorIcon from '../../assets/navigator.png';
import placeholderVideo from '../../assets/placeholder_video.mp4';
import type { ContextItem } from '../../types';

interface NavigatorProps {
  contexts: ContextItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  videoUrls?: string[];
  onVideoChange?: (index: number) => void;
}

const Navigator = ({ contexts, selectedId, onSelect, videoUrls, onVideoChange }: NavigatorProps) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Use provided video URLs or fallback to placeholder
  const videos = videoUrls && videoUrls.length > 0 ? videoUrls : [placeholderVideo];

  // Reset video index when context changes
  useEffect(() => {
    setCurrentVideoIndex(0);
  }, [selectedId]);

  const handlePrevVideo = () => {
    const newIndex = currentVideoIndex > 0 ? currentVideoIndex - 1 : videos.length - 1;
    setCurrentVideoIndex(newIndex);
    onVideoChange?.(newIndex);
  };

  const handleNextVideo = () => {
    const newIndex = currentVideoIndex < videos.length - 1 ? currentVideoIndex + 1 : 0;
    setCurrentVideoIndex(newIndex);
    onVideoChange?.(newIndex);
  };

  return (
    <SectionPanel icon={navigatorIcon} title="Navigator">
      {/* Video Area */}
      <div style={{ padding: '16px 16px 12px 16px' }}>
        <div 
          style={{ 
            position: 'relative', 
            width: '100%', 
            aspectRatio: '16/9', 
            borderRadius: '8px', 
            overflow: 'hidden', 
            backgroundColor: '#000000' 
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const width = rect.width;
            setShowLeftArrow(x < width * 0.3);
            setShowRightArrow(x > width * 0.7);
          }}
          onMouseLeave={() => {
            setShowLeftArrow(false);
            setShowRightArrow(false);
          }}
        >
          <video
            key={currentVideoIndex}
            src={videos[currentVideoIndex]}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            controls
          />
          
          {/* Left Arrow */}
          {showLeftArrow && currentVideoIndex > 0 && (
            <button
              onClick={handlePrevVideo}
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)'}
            >
              <span style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold' }}>‹</span>
            </button>
          )}
          
          {/* Right Arrow */}
          {showRightArrow && currentVideoIndex < videos.length - 1 && (
            <button
              onClick={handleNextVideo}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)'}
            >
              <span style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold' }}>›</span>
            </button>
          )}
        </div>
      </div>

      {/* Divider with Label */}
      <div style={{ padding: '16px 16px 8px 16px' }}>
        <Divider label="Selected Context" />
      </div>

      {/* Context List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px 16px' }}>
        <div style={{ border: '1px solid #CAC4D0', borderRadius: '4px', overflow: 'hidden' }}>
          {contexts.map((context) => (
            <ListItem
              key={context.id}
              item={context}
              isSelected={selectedId === context.id}
              onClick={() => onSelect(context.id)}
            />
          ))}
        </div>
      </div>
    </SectionPanel>
  );
};

export default Navigator;
