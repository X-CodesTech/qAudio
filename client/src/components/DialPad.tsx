import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';
import { Phone, Edit2, X, Check, Plus } from 'lucide-react';
import { CallLine } from '@shared/schema';
import { useVoIP } from '@/contexts/VoIPContext';
import { useLineCount } from '@/contexts/LineCountContext';
import { useToast } from '@/hooks/use-toast';
import { makeDirectCall, formatPhoneNumber } from '@/lib/directCall';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type DialPadProps = {
  selectedLineId?: number | null;
  onSelectLine?: (lineId: number) => void;
  studio?: 'A' | 'B' | 'C' | 'D';  // Studio prop to select the specific studio dial pad
}

export default function DialPad({ selectedLineId, onSelectLine, studio = 'A' }: DialPadProps) {
  const { callLines, makeOutboundCall } = useVoIP();
  const { toast } = useToast();
  const { getStudioLineIds } = useLineCount();
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [selectedLine, setSelectedLine] = useState<string | null>(selectedLineId ? String(selectedLineId) : null);
  const [activeLines, setActiveLines] = useState<number[]>([]);
  
  // Update active lines when callLines changes
  useEffect(() => {
    const active = callLines
      .filter(line => line.status !== 'inactive')
      .map(line => line.id);
    setActiveLines(active);
  }, [callLines]);
  
  // Update internal selected line state when selectedLineId prop changes
  useEffect(() => {
    if (selectedLineId) {
      setSelectedLine(selectedLineId.toString());
    }
  }, [selectedLineId]);
  
  // Automatically select an available line when a number is entered
  useEffect(() => {
    // Only auto-select if there's a number entered and no line is already selected
    if (phoneNumber && !selectedLine) {
      // Find the first inactive line in Studio A (preferably)
      const availableLineA = callLines.find(line => 
        line.status === 'inactive' && line.studio === 'A'
      );
      
      // If no Studio A line is available, try Studio B
      const availableLineB = callLines.find(line => 
        line.status === 'inactive' && line.studio === 'B'
      );
      
      // Set the first available line
      const availableLine = availableLineA || availableLineB;
      if (availableLine) {
        setSelectedLine(availableLine.id.toString());
      }
    }
  }, [phoneNumber, selectedLine, callLines]);

  // Add the dialed digit to the current number
  const handleAddDigit = (digit: string) => {
    setPhoneNumber(prev => prev + digit);
  };

  // Backspace to remove the last digit
  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  // Initiate the call using our enhanced direct call approach
  const handleMakeCall = async () => {
    if (!phoneNumber || !selectedLine) return;
    
    const lineId = parseInt(selectedLine);
    
    // Notify parent component if needed
    if (onSelectLine) onSelectLine(lineId);
    
    // IMPROVEMENT: Immediately update call line status to "ringing" for better UI feedback
    // This allows the call card to appear immediately with a ringing status
    try {
      // First, update the line status to "ringing" to immediately show the call card
      const updateResponse = await fetch(`/api/call-lines/${lineId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ringing',
          phoneNumber: phoneNumber,
          startTime: new Date().toISOString(),
          notes: `Call to ${formatPhoneNumber(phoneNumber)}`,
        }),
      });
      
      if (updateResponse.ok) {
        console.log(`Line ${lineId} status updated to ringing for immediate feedback`);
      }
    } catch (updateError) {
      console.warn("Could not pre-update line status:", updateError);
      // Continue with the call attempt even if status update fails
    }
    
    // Show immediate toast notification for better user feedback
    toast({
      title: "Initiating Call...",
      description: `Connecting to ${formatPhoneNumber(phoneNumber)} on line ${lineId}`,
    });
    
    console.log(`Initiating call to ${phoneNumber} on line ${lineId}`);
    
    try {
      // Fetch the default network interface ID first
      let networkInterfaceId;
      try {
        const response = await fetch('/api/network-interfaces/default');
        if (response.ok) {
          const defaultInterface = await response.json();
          if (defaultInterface && defaultInterface.id) {
            console.log(`Using default network interface: ${defaultInterface.name} (ID: ${defaultInterface.id})`);
            networkInterfaceId = defaultInterface.id;
          }
        }
      } catch (error) {
        console.warn("Could not fetch default network interface:", error);
      }
      
      // Use our enhanced direct call approach that handles network interfaces properly
      const result = await makeDirectCall({
        lineId,
        phoneNumber,
        networkInterfaceId: networkInterfaceId
      });
      
      if (result.success) {
        console.log("Call initiated successfully:", result);
        
        toast({
          title: "Call Connected",
          description: `Connected to ${formatPhoneNumber(phoneNumber)} on line ${lineId}`,
          variant: "default",
        });
        
        // The call is now in active state, allowing producer to talk to the caller
        // before putting them on hold or on-air
      } else {
        console.error("Error initiating call:", result);
        
        // Reset line status if the call failed
        try {
          await fetch(`/api/call-lines/${lineId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'inactive',
              phoneNumber: '',
            }),
          });
        } catch (resetError) {
          console.warn("Could not reset line status:", resetError);
        }
        
        // All our attempts failed, show error message
        toast({
          title: "Call Failed",
          description: result.message || "Could not connect the call",
          variant: "destructive",
        });
        
        // Only fall back to browser SIP as absolute last resort
        console.log("Attempting browser-based SIP as last resort");
        try {
          makeOutboundCall(lineId, phoneNumber);
        } catch (sipError) {
          console.error("SIP fallback also failed:", sipError);
        }
      }
    } catch (error) {
      console.error("Unexpected error making call:", error);
      
      // Reset line status if an error occurred
      try {
        await fetch(`/api/call-lines/${lineId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'inactive',
            phoneNumber: '',
          }),
        });
      } catch (resetError) {
        console.warn("Could not reset line status:", resetError);
      }
      
      toast({
        title: "Call Error",
        description: "An unexpected error occurred while trying to connect",
        variant: "destructive",
      });
      
      // Last-resort fallback
      try {
        makeOutboundCall(lineId, phoneNumber);
      } catch (sipError) {
        console.error("SIP fallback failed after error:", sipError);
      }
    }
    
    // Reset the phone number after dialing
    setPhoneNumber('');
  };

  // Handle keyboard input - we'll only capture Enter and Backspace 
  // to avoid double inputs since we have an input field
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only capture enter and backspace to avoid doubled inputs
      if (e.key === 'Enter' && phoneNumber && selectedLine) {
        e.preventDefault(); // Prevent form submission
        handleMakeCall();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [phoneNumber, selectedLine]);



  // Define a type for quick dial contacts
  type QuickDialContact = {
    name: string;
    number: string;
  };

  // Define studio-specific color schemes
  // Get quick dial contacts from localStorage or use defaults
  const [quickDialContacts, setQuickDialContacts] = useState<QuickDialContact[]>(() => {
    const savedContacts = localStorage.getItem(`quickDial_${studio}`);
    if (savedContacts) {
      try {
        return JSON.parse(savedContacts);
      } catch (e) {
        console.error("Error parsing saved quick dial contacts:", e);
      }
    }
    // Default quick dial contacts if none are saved
    return [
      { name: "News Desk", number: "5551234" },
      { name: "Weather", number: "5552345" },
      { name: "Sports", number: "5553456" },
      { name: "Traffic", number: "5554567" },
      { name: "Management", number: "5555678" },
      { name: "Emergency", number: "5559999" },
      { name: "Technology", number: "5556789" },
      { name: "Entertainment", number: "5557890" }
    ];
  });

  // Save contacts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`quickDial_${studio}`, JSON.stringify(quickDialContacts));
  }, [quickDialContacts, studio]);
  
  // For editing quick dial contacts
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  
  // Handle quick dial selection
  const handleQuickDial = (number: string) => {
    setPhoneNumber(number);
  };
  
  // Open the edit dialog for a specific contact
  const openEditDialog = (index: number) => {
    const contact = quickDialContacts[index];
    setEditingContactIndex(index);
    setEditName(contact.name);
    setEditNumber(contact.number);
    setIsEditingContact(true);
  };
  
  // Save the edited contact
  const saveContact = () => {
    if (editingContactIndex !== null) {
      const updatedContacts = [...quickDialContacts];
      updatedContacts[editingContactIndex] = { name: editName, number: editNumber };
      setQuickDialContacts(updatedContacts);
      
      toast({
        title: "Contact Updated",
        description: `${editName} has been saved to your quick dial.`,
      });
    }
    
    // Reset the editing state
    setIsEditingContact(false);
    setEditingContactIndex(null);
    setEditName('');
    setEditNumber('');
  };
  
  // Create a new quick dial contact
  const createNewContact = () => {
    // Find an empty slot or add to the end
    const newContacts = [...quickDialContacts];
    
    // If we already have 8 contacts, replace the last one
    if (newContacts.length >= 8) {
      newContacts[7] = { name: "New Contact", number: "" };
      setQuickDialContacts(newContacts);
      openEditDialog(7);
    } else {
      // Otherwise add a new contact
      newContacts.push({ name: "New Contact", number: "" });
      setQuickDialContacts(newContacts);
      openEditDialog(newContacts.length - 1);
    }
  };

  const studioColors = {
    A: {
      primary: '#D27D2D',       // Studio A: Orange
      secondary: '#E8945A',
      accent: '#F9BB82',
      text: 'text-orange-200',
      border: 'border-orange-900',
      bg: 'from-[#2A1E17] to-[#1E1611]',
      buttonBg: 'bg-[#3F2A19]',
      buttonHover: 'hover:bg-[#4E341F]',
      selectedBg: 'bg-[#D27D2D]',
      selectedBorder: 'border-[#E8945A]',
    },
    B: {
      primary: '#2D8D27',       // Studio B: Green
      secondary: '#5AB854',
      accent: '#82F97A',
      text: 'text-green-200',
      border: 'border-green-900',
      bg: 'from-[#17291A] to-[#111A13]',
      buttonBg: 'bg-[#1A3F1E]',
      buttonHover: 'hover:bg-[#1F4E25]',
      selectedBg: 'bg-[#2D8D27]',
      selectedBorder: 'border-[#5AB854]',
    },
    C: {
      primary: '#2D72D2',       // Studio C: Blue
      secondary: '#5A9ED8',
      accent: '#82C4F9',
      text: 'text-blue-200',
      border: 'border-blue-900',
      bg: 'from-[#17202A] to-[#11161E]',
      buttonBg: 'bg-[#1A2A3F]',
      buttonHover: 'hover:bg-[#1F334E]',
      selectedBg: 'bg-[#2D72D2]',
      selectedBorder: 'border-[#5A9ED8]',
    },
    D: {
      primary: '#8D2D8D',       // Studio D: Purple
      secondary: '#B85AB8',
      accent: '#F982F9',
      text: 'text-purple-200',
      border: 'border-purple-900',
      bg: 'from-[#2A172A] to-[#1A111A]',
      buttonBg: 'bg-[#3F1A3F]',
      buttonHover: 'hover:bg-[#4E1F4E]',
      selectedBg: 'bg-[#8D2D8D]',
      selectedBorder: 'border-[#B85AB8]',
    }
  };
  
  // Get the color scheme based on the studio
  const colors = studioColors[studio];
  
  // Get dynamic line IDs from LineCountContext based on the current studio and configured line count
  const studioLineIds = getStudioLineIds(studio);
  const studioLines = callLines.filter(line => studioLineIds.includes(line.id));
  
  // If we don't have all the lines for this studio in the callLines array,
  // we need to create placeholder lines for the missing ones
  if (studioLines.length < studioLineIds.length) {
    const existingIds = studioLines.map(line => line.id);
    const missingIds = studioLineIds.filter(id => !existingIds.includes(id));
    
    missingIds.forEach(id => {
      studioLines.push({
        id,
        status: 'inactive',
        studio: studio,
        phoneNumber: '',
        startTime: null as unknown as Date,
        notes: '',
        topic: '',
        audioRouting: {
          input: 'default',
          output: 'default'
        }
      });
    });
    
    // Sort the lines by ID to ensure they appear in the correct order
    studioLines.sort((a, b) => a.id - b.id);
  }
  
  // Determine if we're in a compact layout based on line count
  const isCompactMode = studioLineIds.length > 4;
  
  console.log(`Rendering dial pad for Studio ${studio} with ${studioLines.length} lines`);
  
  return (
    <div className="w-full">
      <div className={`w-full rounded-md p-1 border ${colors.border} bg-zinc-900`}>
        {/* Studio badge */}
        <div className="flex justify-between items-center mb-1">
          <div className={`text-base font-bold ${colors.text} px-2 py-0.5 rounded-md`} 
               style={{backgroundColor: colors.primary}}>
            STUDIO {studio}
          </div>
        </div>
        
        <div className="space-y-1">
          {/* Phone number input with studio-specific styling */}
          <div className={`bg-black text-white p-1 rounded-md flex items-center mb-1 border ${colors.border}`}>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={`bg-transparent border-0 text-base font-mono text-white focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-8 tracking-wider`}
              placeholder="Enter number..."
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white hover:bg-zinc-800 rounded-md"
              onClick={handleBackspace}
              disabled={!phoneNumber}
            >
              <span className="h-3 w-3 font-bold text-sm">←</span>
            </Button>
          </div>
          
          {/* Line selection buttons for current studio only */}
          <div className="mb-1">
            <h3 className={`text-xs font-bold mb-1 ${colors.text}`}>Select Line</h3>
            <div className="grid grid-cols-4 gap-1">
              {studioLines.map((line) => {
                const isActive = line.status !== 'inactive';
                const isSelected = selectedLine === line.id.toString();
                const isDisabled = isActive && !isSelected;
                
                const handleLineSelect = () => {
                  setSelectedLine(line.id.toString());
                  if (onSelectLine) onSelectLine(line.id);
                };
                
                return (
                  <Button
                    key={line.id}
                    onClick={handleLineSelect}
                    disabled={isDisabled}
                    className={cn(
                      `flex-1 py-0.5 h-7 text-sm font-medium flex items-center justify-center gap-1 relative rounded-md border shadow-sm`,
                      line.status === 'on-air' ? "bg-red-600 text-white border-red-400" : 
                      isActive ? "bg-orange-600 text-white border-orange-400" : 
                      isSelected ? `${colors.selectedBg} text-white ${colors.selectedBorder}` : 
                      `${colors.buttonBg} text-white ${colors.buttonHover}`,
                      isActive && !isSelected && "cursor-not-allowed opacity-70",
                    )}
                  >
                    {isActive && (
                      <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-green-500"></span>
                    )}
                    {line.id}
                  </Button>
                );
              })}
            </div>
          </div>
          
          {/* Dial pad with studio-specific color scheme - more compact when there are more lines */}
          <div className="mt-1">
            <div className={`grid grid-cols-3 gap-${isCompactMode ? '0.5' : '1'} mb-1`}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((digit) => (
                <Button
                  key={digit}
                  onClick={() => handleAddDigit(digit.toString())}
                  className={`py-0.5 ${isCompactMode ? 'h-7 text-base' : 'h-8 text-lg'} font-bold bg-zinc-800 hover:bg-zinc-700 text-white rounded-md border border-zinc-700`}
                  style={{ borderBottom: `2px solid ${colors.primary}` }}
                >
                  {digit}
                </Button>
              ))}
            </div>
            
            {/* Call button styled for the specific studio */}
            <Button
              onClick={handleMakeCall}
              disabled={!phoneNumber || !selectedLine}
              className="w-full py-1 h-8 mt-1 text-white text-base font-medium rounded-md flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{backgroundColor: colors.primary, border: `1px solid ${colors.border}`}}
            >
              <Phone className="h-4 w-4" />
              <span>Call</span>
            </Button>
          </div>

          {/* Quick Dial Section - more compact when there are more lines */}
          <div className={`mt-${isCompactMode ? '1' : '2'}`}>
            <div className={`flex justify-between items-center ${isCompactMode ? 'mb-1' : 'mb-3'}`}>
              <h3 className="font-bold flex items-center" style={{ 
                color: '#D27D2D', 
                fontSize: isCompactMode ? '18px' : '22px' 
              }}>
                <Phone className={`${isCompactMode ? 'h-4 w-4' : 'h-5 w-5'} mr-2`} style={{ color: '#D27D2D' }}/>
                QUICK DIAL
              </h3>
              <Button
                onClick={createNewContact}
                className={`${isCompactMode ? 'h-6 px-1' : 'h-8 px-2 py-1'} bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white rounded-md flex items-center gap-1`}
              >
                <Plus className={`${isCompactMode ? 'h-3 w-3' : 'h-4 w-4'}`} />
                <span className="text-xs font-medium">Add</span>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {quickDialContacts.map((contact: QuickDialContact, index: number) => (
                <div 
                  key={`${contact.name}-${index}`} 
                  className="relative group"
                >
                  <Button
                    onClick={() => handleQuickDial(contact.number)}
                    className={`py-2 w-full ${isCompactMode ? 'h-12' : 'h-16'} font-medium text-white rounded-md border border-orange-700 flex flex-col items-center justify-center hover:bg-orange-600`}
                    style={{ 
                      backgroundColor: colors.primary,
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <span className="truncate w-full text-center font-bold text-white" style={{ fontSize: isCompactMode ? '13px' : '15px' }}>{contact.name}</span>
                    <span className="text-white opacity-90" style={{ fontSize: isCompactMode ? '11px' : '13px' }}>{contact.number}</span>
                  </Button>
                  
                  {/* Edit button that appears on hover */}
                  <button 
                    onClick={() => openEditDialog(index)}
                    className="absolute top-1 right-1 bg-black/50 hover:bg-black/80 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Dialog for editing contacts */}
          <Dialog open={isEditingContact} onOpenChange={setIsEditingContact}>
            <DialogContent className="sm:max-w-md bg-zinc-900 border border-zinc-700 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingContactIndex !== null ? "Edit Quick Dial Contact" : "Add New Contact"}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <label htmlFor="contactName" className="text-sm font-medium text-zinc-300">
                    Contact Name
                  </label>
                  <Input
                    id="contactName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Contact Name"
                    className="bg-zinc-800 border-zinc-700 text-white h-9"
                  />
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="contactNumber" className="text-sm font-medium text-zinc-300">
                    Phone Number
                  </label>
                  <Input
                    id="contactNumber"
                    value={editNumber}
                    onChange={(e) => setEditNumber(e.target.value)}
                    placeholder="Phone Number"
                    className="bg-zinc-800 border-zinc-700 text-white h-9"
                  />
                </div>
              </div>
              
              <DialogFooter className="flex justify-between items-center border-t border-zinc-800 pt-3">
                <Button
                  onClick={() => setIsEditingContact(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                
                <Button
                  onClick={saveContact}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!editName.trim() || !editNumber.trim()}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}