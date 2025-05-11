import React from 'react';

// Audio level visualization bar
const LevelMeter: React.FC<{ 
  level?: number, 
  vertical?: boolean, 
  height?: string | number, 
  width?: string | number 
}> = ({ 
  level = 75, 
  vertical = false, 
  height = "h-4", 
  width = "w-full" 
}) => {
  const heightStyle = typeof height === 'number' ? `${height}px` : height;
  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  
  if (vertical) {
    return (
      <div 
        className={`bg-zinc-800 rounded-sm overflow-hidden ${typeof width === 'string' && width.startsWith('w-') ? width : 'w-full'}`} 
        style={{ 
          height: typeof height === 'string' && height.startsWith('h-') ? undefined : heightStyle
        }}
      >
        <div 
          className="w-full bg-gradient-to-t from-green-500 via-yellow-500 to-red-500" 
          style={{ height: `${level}%` }} 
        ></div>
      </div>
    );
  }
  
  return (
    <div 
      className={`bg-zinc-800 rounded-sm overflow-hidden ${typeof height === 'string' && height.startsWith('h-') ? height : ''} ${typeof width === 'string' && width.startsWith('w-') ? width : ''}`}
      style={{ 
        height: typeof height === 'string' && height.startsWith('h-') ? undefined : heightStyle,
        width: typeof width === 'string' && width.startsWith('w-') ? undefined : widthStyle
      }}
    >
      <div 
        className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" 
        style={{ width: `${level}%` }} 
      ></div>
    </div>
  );
};

export default LevelMeter;