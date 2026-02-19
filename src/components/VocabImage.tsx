import React from 'react';

interface VocabImageProps {
  src: string;
  alt: string;
  className: string;
  projectPath: string;
}

/**
 * Component to handle vocabulary image loading
 * Supports both relative paths (images/photo.jpg) and base64 data URLs
 */
const VocabImage: React.FC<VocabImageProps> = ({ src, alt, className, projectPath }) => {
  const [imageSrc, setImageSrc] = React.useState<string>(src);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const loadImage = async () => {
      // If it's already a data URL (base64), use it directly
      if (src.startsWith('data:')) {
        setImageSrc(src);
        setLoading(false);
        return;
      }

      // If it's a relative path (e.g., "images/photo.jpg"), load from project folder
      if (src.startsWith('images/')) {
        const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI?.fs;
        
        if (isElectron && projectPath) {
          try {
            const electronAPI = (window as any).electronAPI;
            const result = await electronAPI.fs.getImagePath(projectPath, src);
            
            if (result.success && result.dataUrl) {
              setImageSrc(result.dataUrl);
            } else {
              console.error('Failed to load image:', result.error);
              setError(true);
            }
          } catch (err) {
            console.error('Error loading image:', err);
            setError(true);
          }
        } else {
          // In browser mode, try to load directly (won't work but shows error)
          setError(true);
        }
        setLoading(false);
        return;
      }

      // Otherwise, assume it's a URL
      setImageSrc(src);
      setLoading(false);
    };

    loadImage();
  }, [src, projectPath]);

  if (loading) {
    return (
      <div 
        className={className} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: '#f0f0f0',
          minHeight: '200px'
        }}
      >
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={className} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: '#f0f0f0', 
          color: '#999',
          minHeight: '200px'
        }}
      >
        Image not found
      </div>
    );
  }

  return <img src={imageSrc} alt={alt} className={className} />;
};

export default VocabImage;
