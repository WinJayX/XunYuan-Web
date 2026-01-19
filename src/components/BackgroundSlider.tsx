'use client';

import { useEffect, useState } from 'react';

interface BackgroundSliderProps {
  images: string[];
}

export default function BackgroundSlider({ images }: BackgroundSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (images.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % images.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="background-container">
      {images.slice(0, 3).map((img, index) => (
        <div 
          key={index}
          className={`background-slide ${index === currentSlide ? 'active' : ''}`}
          style={{ backgroundImage: `url(${img})` }}
        />
      ))}
      <div className="background-overlay" />
    </div>
  );
}
