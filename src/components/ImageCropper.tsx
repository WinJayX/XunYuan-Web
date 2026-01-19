'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PhotoCrop } from '@/types/family';

interface ImageCropperProps {
  imageSrc: string;
  initialCrop?: PhotoCrop;
  onConfirm: (crop: PhotoCrop) => void;
  onCancel: () => void;
}

const PREVIEW_SIZE = 200;

export default function ImageCropper({ imageSrc, initialCrop, onConfirm, onCancel }: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleImageLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setImageSize({ width: w, height: h });
    const minScale = Math.max(PREVIEW_SIZE / w, PREVIEW_SIZE / h);
    if (initialCrop) {
      setScale(Math.max(minScale, initialCrop.scale));
      setPosition({ x: initialCrop.x, y: initialCrop.y });
    } else {
      setScale(minScale);
      setPosition({ x: 50, y: 50 });
    }
    setImageLoaded(true);
  };

  const displayWidth = imageSize.width * scale;
  const displayHeight = imageSize.height * scale;

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX, y: clientY });
  };

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !imageLoaded) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    const deltaXPercent = (deltaX / displayWidth) * 100;
    const deltaYPercent = (deltaY / displayHeight) * 100;
    setPosition(prev => {
      const minX = (PREVIEW_SIZE / displayWidth) * 50;
      const maxX = 100 - minX;
      const minY = (PREVIEW_SIZE / displayHeight) * 50;
      const maxY = 100 - minY;
      return {
        x: Math.max(minX, Math.min(maxX, prev.x - deltaXPercent)),
        y: Math.max(minY, Math.min(maxY, prev.y - deltaYPercent))
      };
    });
    setDragStart({ x: clientX, y: clientY });
  }, [isDragging, imageLoaded, displayWidth, displayHeight, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value);
    const minScale = Math.max(PREVIEW_SIZE / imageSize.width, PREVIEW_SIZE / imageSize.height);
    const clampedScale = Math.max(minScale, newScale);
    const newDisplayWidth = imageSize.width * clampedScale;
    const newDisplayHeight = imageSize.height * clampedScale;
    const minX = (PREVIEW_SIZE / newDisplayWidth) * 50;
    const maxX = 100 - minX;
    const minY = (PREVIEW_SIZE / newDisplayHeight) * 50;
    const maxY = 100 - minY;
    setScale(clampedScale);
    setPosition(prev => ({
      x: Math.max(minX, Math.min(maxX, prev.x)),
      y: Math.max(minY, Math.min(maxY, prev.y))
    }));
  };

  const handleConfirm = () => {
    onConfirm({ x: position.x, y: position.y, scale });
  };

  const minScale = imageSize.width > 0 
    ? Math.max(PREVIEW_SIZE / imageSize.width, PREVIEW_SIZE / imageSize.height) 
    : 0.1;

  const imgStyle: React.CSSProperties = imageLoaded ? {
    width: displayWidth,
    height: displayHeight,
    position: 'absolute',
    left: `${PREVIEW_SIZE / 2 - (position.x / 100) * displayWidth}px`,
    top: `${PREVIEW_SIZE / 2 - (position.y / 100) * displayHeight}px`,
  } : { display: 'none' };

  return (
    <div className="image-cropper-overlay">
      <div className="image-cropper-modal">
        <h3>调整照片显示区域</h3>
        <p className="cropper-hint">拖动调整位置，滑动缩放（原图完整保存）</p>
        <div 
          ref={containerRef}
          className="cropper-container"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="预览"
            onLoad={handleImageLoad}
            style={imgStyle}
            draggable={false}
          />
          {!imageLoaded && <span className="loading-text">加载中...</span>}
          <div className="cropper-frame" />
        </div>
        {imageLoaded && (
          <div className="cropper-controls">
            <span>🔍-</span>
            <input
              type="range"
              min={minScale}
              max={minScale * 4}
              step={0.01}
              value={scale}
              onChange={handleScaleChange}
              className="scale-slider"
            />
            <span>🔍+</span>
          </div>
        )}
        <div className="cropper-buttons">
          <button className="btn-cancel" onClick={onCancel}>取消</button>
          <button className="btn-confirm" onClick={handleConfirm} disabled={!imageLoaded}>确认</button>
        </div>
      </div>
    </div>
  );
}
