import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { CartButton, CartItem } from "@/components/CartButton";
import { PlaybackLengthMeter, PlaybackInfo } from "@/components/PlaybackLengthMeter";
import { FileMusic, Edit, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Demo colors for cart buttons
const CART_COLORS = [
  '#2563eb', // Blue
  '#d97706', // Amber
  '#059669', // Emerald
  '#dc2626', // Red
  '#7c3aed', // Violet
  '#0891b2', // Cyan
  '#4338ca', // Indigo
  '#16a34a', // Green
];

// Demo durations for cart buttons (in seconds)
const DEMO_DURATIONS = [
  30, 15, 45, 60, 20, 10, 40, 25, 35, 15, 30, 45
];

interface CartWallContainerProps {
  className?: string;
  onPlayCart?: (cartNumber: number, pageId: number) => void;
}

export function CartWallContainer({ className, onPlayCart }: CartWallContainerProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCart, setEditingCart] = useState<CartItem | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [tempLabel, setTempLabel] = useState('');
  const [tempColor, setTempColor] = useState('');
  
  // State for playback tracking
  const [playingCart, setPlayingCart] = useState<CartItem | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const playbackTimerRef = useRef<number | null>(null);
  
  // Define 10 pages of cart items (12 per page)
  const [cartPages, setCartPages] = useState<CartItem[][]>(() => {
    const pages = [];
    
    // Create 10 pages
    for (let pageId = 1; pageId <= 10; pageId++) {
      const pageCarts = [];
      
      // 12 carts per page
      for (let num = 1; num <= 12; num++) {
        const cartNumber = (pageId - 1) * 12 + num;
        const defaultLabels = [
          "Station ID", "News Intro", "Weather Jingle", "Traffic Intro", 
          "Commercial Break", "Top Hour ID", "Sports Update", "Interview Intro",
          "Sweeper", "Promo", "Sponsor Message", "Transition"
        ];
        
        // Assign a default label for the first page only
        const label = pageId === 1 ? defaultLabels[num - 1] : `Cart ${cartNumber}`;
        
        // Assign a color
        const colorIndex = (num - 1) % CART_COLORS.length;
        const color = CART_COLORS[colorIndex];
        
        // Assign a duration (demo)
        const durationIndex = (num - 1) % DEMO_DURATIONS.length;
        const duration = DEMO_DURATIONS[durationIndex];
        
        pageCarts.push({
          number: cartNumber,
          label,
          color,
          pageId,
          duration // Add duration in seconds
        });
      }
      pages.push(pageCarts);
    }
    
    return pages;
  });
  
  const totalPages = cartPages.length;
  const currentCarts = cartPages[currentPage - 1] || [];
  
  // Create playback info for the PlaybackLengthMeter component
  const playbackInfo: PlaybackInfo | null = playingCart ? {
    isPlaying: true,
    duration: playingCart.duration || 30,
    progress: playbackProgress,
    label: playingCart.label
  } : null;
  
  // Effect to handle playback progress
  useEffect(() => {
    if (playingCart && playingCart.duration) {
      // Clear any existing timer
      if (playbackTimerRef.current) {
        window.clearInterval(playbackTimerRef.current);
      }
      
      // Start a new timer
      const stepSize = 100 / (playingCart.duration * 2); // Update twice per second
      playbackTimerRef.current = window.setInterval(() => {
        setPlaybackProgress(prev => {
          if (prev >= 100) {
            // Playback finished
            window.clearInterval(playbackTimerRef.current!);
            setPlayingCart(null);
            return 0;
          }
          return prev + stepSize;
        });
      }, 500); // Update every 500ms for smooth animation
    }
    
    return () => {
      if (playbackTimerRef.current) {
        window.clearInterval(playbackTimerRef.current);
      }
    };
  }, [playingCart]);
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  const handleEditCart = (cart: CartItem) => {
    setEditingCart(cart);
    setTempLabel(cart.label);
    setTempColor(cart.color || '');
    setShowEditDialog(true);
  };
  
  const handleSaveCart = () => {
    if (!editingCart) return;
    
    // Update the cart in our state
    const updatedPages = [...cartPages];
    const pageIndex = editingCart.pageId - 1;
    const cartIndex = updatedPages[pageIndex].findIndex(c => c.number === editingCart.number);
    
    if (cartIndex !== -1) {
      updatedPages[pageIndex][cartIndex] = {
        ...editingCart,
        label: tempLabel,
        color: tempColor
      };
      
      setCartPages(updatedPages);
      
      toast({
        title: "Cart updated",
        description: `Cart #${editingCart.number} has been updated`,
      });
    }
    
    // Close dialog and reset state
    setShowEditDialog(false);
    setEditingCart(null);
  };
  
  const handlePlayCart = (cartNumber: number, pageId: number) => {
    // Find the cart
    const pageIndex = pageId - 1;
    const cart = cartPages[pageIndex]?.find(c => c.number === cartNumber);
    
    if (!cart) return;
    
    // If the same cart is already playing, stop it
    if (playingCart && playingCart.number === cartNumber && playingCart.pageId === pageId) {
      setPlayingCart(null);
      setPlaybackProgress(0);
      
      if (playbackTimerRef.current) {
        window.clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      
      toast({
        title: "Cart stopped",
        description: `Stopped playback of cart #${cartNumber}`,
      });
      
      // Delegate to parent component if provided
      if (onPlayCart) {
        onPlayCart(cartNumber, pageId);
      }
      
      return;
    }
    
    // Otherwise, start playing the new cart
    setPlayingCart(cart);
    setPlaybackProgress(0);
    
    toast({
      title: "Cart triggered",
      description: `Playing cart #${cartNumber} from page ${pageId}`,
    });
    
    // Delegate to parent component if provided
    if (onPlayCart) {
      onPlayCart(cartNumber, pageId);
    }
  };
  
  return (
    <div className={`flex flex-col h-full ${className}`} style={{ display: "flex", flexDirection: "column" }}>
      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden flex-grow flex flex-col" style={{ flexGrow: 1, outline: "3px solid #626262" }}>
        <CardHeader className="py-1 px-3 border-b border-zinc-800 flex flex-row justify-between items-center shrink-0 text-white">
          <CardTitle className="text-xs flex items-center text-white">
            <FileMusic className="h-3 w-3 mr-1 text-amber-400" />
            Cart Wall
            <span className="ml-1 text-white">• Page {currentPage}/{totalPages}</span>
          </CardTitle>
          
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? <Save className="h-3 w-3" /> : <Edit className="h-3 w-3" />}
            </Button>
            
            {/* Page navigation */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-1 flex-1 flex flex-col overflow-auto" style={{ minHeight: "188px" }}>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-1">
            {currentCarts.map((cart) => (
              <CartButton
                key={`cart-${cart.pageId}-${cart.number}`}
                cart={cart}
                onPlay={handlePlayCart}
                onEdit={handleEditCart}
                isEditMode={isEditMode}
                size="medium"
                isPlaying={playingCart ? (playingCart.number === cart.number && playingCart.pageId === cart.pageId) : false}
                progress={playingCart ? (playingCart.number === cart.number && playingCart.pageId === cart.pageId ? playbackProgress : 0) : 0}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Playback meter moved to MAirlistStylePage.tsx */}
      
      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Cart Button</DialogTitle>
            <DialogDescription>
              Customize the appearance and behavior of this cart button.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 gap-4 items-center">
              <Label className="text-right">Button #</Label>
              <div className="col-span-3">
                <Input value={editingCart?.number} disabled />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 items-center">
              <Label htmlFor="label" className="text-right">Label</Label>
              <div className="col-span-3">
                <Input 
                  id="label" 
                  value={tempLabel} 
                  onChange={(e) => setTempLabel(e.target.value)} 
                  placeholder="Enter cart label" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 items-center">
              <Label className="text-right">Color</Label>
              <div className="col-span-3">
                <Select value={tempColor} onValueChange={setTempColor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="#2563eb">Blue</SelectItem>
                    <SelectItem value="#d97706">Amber</SelectItem>
                    <SelectItem value="#059669">Emerald</SelectItem>
                    <SelectItem value="#dc2626">Red</SelectItem>
                    <SelectItem value="#7c3aed">Violet</SelectItem>
                    <SelectItem value="#0891b2">Cyan</SelectItem>
                    <SelectItem value="#4338ca">Indigo</SelectItem>
                    <SelectItem value="#16a34a">Green</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 items-center">
              <Label className="text-right">Preview</Label>
              <div className="col-span-3">
                {editingCart && (
                  <CartButton 
                    cart={{
                      ...editingCart,
                      label: tempLabel,
                      color: tempColor
                    }}
                    size="medium"
                  />
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCart}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}