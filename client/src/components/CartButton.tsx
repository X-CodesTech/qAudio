import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { FileMusic, Play, Pause, Pencil } from "lucide-react";

export interface CartItem {
  number: number;
  label: string;
  color?: string;
  trackId?: number;
  pageId: number;
  duration?: number; // Duration in seconds
}

interface CartButtonProps {
  cart: CartItem;
  onPlay?: (cartNumber: number, pageId: number) => void;
  onEdit?: (cart: CartItem) => void;
  size?: 'small' | 'medium' | 'large';
  isEditMode?: boolean;
  isPlaying?: boolean;
  progress?: number; // 0-100 percentage
}

export function CartButton({ 
  cart, 
  onPlay, 
  onEdit, 
  size = 'medium',
  isEditMode = false,
  isPlaying = false,
  progress = 0
}: CartButtonProps) {
  // Default color if none provided
  const buttonColor = cart.color || '#2563eb'; // Default blue
  const [isBlinking, setIsBlinking] = useState(false);

  // Button sizes based on the size prop
  const buttonSizes = {
    small: 'h-14 text-xs',
    medium: 'h-20 text-sm',
    large: 'h-24 text-base'
  };

  const buttonClass = buttonSizes[size];
  
  // Handle blinking effect when cart is playing
  useEffect(() => {
    if (isPlaying) {
      // Start blinking and keep it blinking until cart finishes or is stopped
      setIsBlinking(true);
    } else {
      // Stop blinking when cart stops playing
      setIsBlinking(false);
    }
  }, [isPlaying]);
  
  return (
    <Button
      variant="outline"
      className={`relative w-full ${buttonClass} p-1 overflow-hidden border-2 flex flex-col items-center justify-center ${isBlinking ? 'animate-[blink_1000ms_ease-in-out_infinite]' : ''}`}
      style={{ 
        backgroundColor: isBlinking ? '#ff0000' : `${buttonColor}55`, // Solid red when blinking
        borderColor: isPlaying ? '#ff0000' : buttonColor,
        boxShadow: isBlinking ? '0 0 15px rgba(255, 0, 0, 0.7)' : `inset 0 0 15px ${buttonColor}66`, // Enhanced glow when blinking
        transition: isBlinking ? 'none' : 'background-color 100ms linear'
      }}
      onClick={() => {
        if (!isEditMode && onPlay) {
          onPlay(cart.number, cart.pageId);
        }
      }}
    >
      {/* Playback progress indicator (shows only when playing) */}
      {isPlaying && (
        <div 
          className="absolute bottom-0 left-0 h-1 bg-red-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      )}

      {/* Main content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
        <div className="text-center mb-1 font-medium line-clamp-2 w-full text-white">
          {cart.label || `Cart #${cart.number}`}
        </div>
        <FileMusic 
          className="h-4 w-4 mb-1" 
          style={{ color: isPlaying ? '#ff0000' : 'white' }}
        />
        {!isEditMode && (
          <div className="text-xs text-white/90 mt-auto">#{cart.number}</div>
        )}
      </div>
      
      {/* Edit overlay */}
      {isEditMode && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
          <button 
            className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) onEdit(cart);
            }}
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {/* Play/Pause indicator that appears on hover when not in edit mode */}
      {!isEditMode && !isBlinking && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          {isPlaying ? (
            <Pause className="h-8 w-8 text-red-500" />
          ) : (
            <Play className="h-8 w-8 text-white" />
          )}
        </div>
      )}

      {/* Show a pulsing indicator when playing */}
      {isPlaying && (
        <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
      )}
    </Button>
  );
}