import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useTraffic } from '@/contexts/TrafficContext';
import { RadioAutomationProvider } from '@/contexts/RadioAutomationContext';
import { 
  Calendar, 
  FileAudio, 
  Plus, 
  Trash, 
  Edit, 
  Users, 
  Megaphone, 
  BarChart, 
  FileText,
  MoreVertical,
  Clock,
  DollarSign,
  Calendar as CalendarIcon,
  ListFilter,
  PieChart,
  Tag,
  ChevronRight,
  Briefcase,
  LogOut,
  Home
} from 'lucide-react';
import { format } from 'date-fns';
import { generateInvoicePDF, generateQuickInvoice } from '@/lib/invoiceGenerator';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrafficProvider } from '@/contexts/TrafficContext';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'wouter';
import { 
  InsertCommercialClient, 
  InsertCommercialCampaign, 
  CommercialClient,
  CommercialCampaign,
  CommercialSpot
} from '@shared/schema';

// Define consistent professional color scheme
const colors = {
  primary: {
    light: '#3498db',
    main: '#2980b9',
    dark: '#1c638e'
  },
  secondary: {
    light: '#2ecc71',
    main: '#27ae60',
    dark: '#1e8449'
  },
  accent: {
    yellow: '#f39c12',
    red: '#e74c3c',
    purple: '#9b59b6',
    orange: '#e67e22',
    blue: '#3498db',
    green: '#2ecc71'
  },
  status: {
    active: '#2ecc71',
    pending: '#f39c12',
    completed: '#3498db',
    cancelled: '#e74c3c',
    info: '#9b59b6'
  }
};

const ClientListItem: React.FC<{ 
  client: CommercialClient; 
  isSelected: boolean; 
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
}> = ({ client, isSelected, onClick, onDelete, onEdit }) => {
  const getBudgetInfo = () => {
    if (!client.budget) return null;
    
    const budget = parseFloat(client.budget);
    const spent = client.budgetSpent ? parseFloat(client.budgetSpent) : 0;
    const remaining = budget - spent;
    const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;
    
    return { budget, spent, remaining, percentage };
  };
  
  const budgetInfo = getBudgetInfo();
  const isActive = client.isActive !== false; // Default to true if undefined
  
  // Get budget progress color based on percentage
  const getBudgetColor = (percentage: number) => {
    if (percentage >= 100) return colors.status.cancelled;
    if (percentage >= 80) return colors.status.pending;
    return colors.status.active;
  };
  
  return (
    <div 
      className={cn(
        "flex justify-between items-center p-4 border-b hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer rounded-md transition-colors duration-150",
        isSelected ? "bg-slate-50 dark:bg-slate-900 shadow-sm" : "",
        !isActive ? "opacity-60" : ""
      )}
      onClick={onClick}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-blue-500" />
          <h3 className="font-medium text-slate-900 dark:text-slate-100">{client.name}</h3>
          {!isActive && (
            <Badge 
              variant="outline" 
              className="ml-2 text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Inactive
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground flex items-center mt-1">
          <Users className="h-3 w-3 mr-1 text-slate-400" />
          {client.contactName || 'No contact'}
        </p>
        
        {budgetInfo && (
          <div className="mt-3 flex items-center text-xs text-muted-foreground">
            <DollarSign className="h-3 w-3 mr-1 text-blue-500" />
            <div className="w-full">
              <div className="flex justify-between mb-1">
                <span className="font-medium">Budget</span>
                <span>${budgetInfo.spent.toFixed(2)} of ${budgetInfo.budget.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full"
                  style={{ 
                    width: `${Math.min(100, budgetInfo.percentage)}%`,
                    backgroundColor: getBudgetColor(budgetInfo.percentage) 
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span 
                  className="font-medium"
                  style={{ color: getBudgetColor(budgetInfo.percentage) }}
                >
                  {budgetInfo.percentage}% used
                </span>
                <span className="text-slate-500">
                  ${budgetInfo.remaining.toFixed(2)} remaining
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Client Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Edit className="mr-2 h-4 w-4 text-blue-500" /> Edit Client
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
              <FileAudio className="mr-2 h-4 w-4 text-green-500" /> Upload Audio File
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
              <Clock className="mr-2 h-4 w-4 text-amber-500" /> Reschedule Campaign
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
              <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500" /> Client History
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
              <PieChart className="mr-2 h-4 w-4 text-purple-500" /> View Reports
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash className="mr-2 h-4 w-4" /> Delete Client
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {client.createdAt && (
          <span className="text-xs text-slate-400 mt-2">
            Added: {format(new Date(client.createdAt), 'MMM d, yyyy')}
          </span>
        )}
      </div>
    </div>
  );
};

const ClientDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (client: InsertCommercialClient) => void;
  client?: CommercialClient;
}> = ({ isOpen, onClose, onSubmit, client }) => {
  const [name, setName] = useState(client?.name || '');
  const [contactName, setContactName] = useState(client?.contactName || '');
  const [contactEmail, setContactEmail] = useState(client?.contactEmail || '');
  const [contactPhone, setContactPhone] = useState(client?.contactPhone || '');
  const [address, setAddress] = useState(client?.address || '');
  const [budget, setBudget] = useState(client?.budget?.toString() || '');
  const [budgetSpent, setBudgetSpent] = useState(client?.budgetSpent?.toString() || '0');
  const [notes, setNotes] = useState(client?.notes || '');
  const [isActive, setIsActive] = useState(client?.isActive !== false); // Default to true if undefined

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      contactName,
      contactEmail,
      contactPhone,
      address,
      // budget field is excluded from insertCommercialClientSchema
      budgetSpent: budgetSpent || "0",
      notes,
      isActive
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>
            {client ? 'Update the client information' : 'Fill in the details to create a new client'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="required">Company Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactName">Contact Person</Label>
              <Input
                id="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactPhone">Phone</Label>
                <Input
                  id="contactPhone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="budget">Budget</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="budget"
                    className="pl-7"
                    type="number"
                    step="0.01"
                    min="0"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="budgetSpent">Budget Spent</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="budgetSpent"
                    className="pl-7"
                    type="number"
                    step="0.01"
                    min="0"
                    value={budgetSpent}
                    onChange={(e) => setBudgetSpent(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Additional information about this client..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked as boolean)}
              />
              <Label htmlFor="isActive" className="cursor-pointer">Active Client</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {client ? 'Update Client' : 'Add Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const CampaignListItem: React.FC<{ 
  campaign: CommercialCampaign; 
  isSelected: boolean; 
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onReport: () => void;
  onInvoice: () => void;
}> = ({ campaign, isSelected, onClick, onDelete, onEdit, onReport, onInvoice }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div 
      className={cn(
        "flex justify-between items-center p-3 border-b hover:bg-muted cursor-pointer",
        isSelected ? "bg-muted" : ""
      )}
      onClick={onClick}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{campaign.name}</h3>
          <Badge className={getStatusColor(campaign.status)}>
            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground flex items-center mt-1">
          <Calendar className="h-3 w-3 mr-1" />
          {format(new Date(campaign.startDate), 'MMM d, yyyy')} - {format(new Date(campaign.endDate), 'MMM d, yyyy')}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Edit className="mr-2 h-4 w-4" /> Edit Campaign
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onReport(); }}>
            <BarChart className="mr-2 h-4 w-4" /> Generate Report
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onInvoice(); }}>
            <FileText className="mr-2 h-4 w-4" /> Generate Invoice
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash className="mr-2 h-4 w-4" /> Delete Campaign
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const DatePickerWithPresets = ({ 
  date, 
  setDate,
  label
}: { 
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  label: string;
}) => {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

const weekdays = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const CampaignDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (campaign: InsertCommercialCampaign) => void;
  campaign?: CommercialCampaign;
  clientId: number;
}> = ({ isOpen, onClose, onSubmit, campaign, clientId }) => {
  const [name, setName] = useState(campaign?.name || '');
  const [startDate, setStartDate] = useState<Date | undefined>(campaign?.startDate ? new Date(campaign.startDate) : undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(campaign?.endDate ? new Date(campaign.endDate) : undefined);
  const [status, setStatus] = useState(campaign?.status || 'pending');
  const [totalSpots, setTotalSpots] = useState(campaign?.totalSpots || 0);
  const [dailySpots, setDailySpots] = useState(campaign?.dailySpots || 0);
  const [spotDuration, setSpotDuration] = useState(campaign?.spotDuration || 30);
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(campaign?.daysOfWeek || []);
  const [timeRestrictions, setTimeRestrictions] = useState(campaign?.timeRestrictions || '');
  const [notes, setNotes] = useState(campaign?.notes || '');

  const handleDayToggle = (day: string) => {
    setDaysOfWeek((prev) => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      return;
    }
    onSubmit({
      clientId,
      name,
      startDate,
      endDate,
      status,
      totalSpots,
      dailySpots,
      spotDuration,
      daysOfWeek,
      timeRestrictions,
      notes,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Edit Campaign' : 'Add New Campaign'}</DialogTitle>
          <DialogDescription>
            {campaign ? 'Update the campaign information' : 'Fill in the details to create a new advertising campaign'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="required">Campaign Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <DatePickerWithPresets date={startDate} setDate={setStartDate} label="Start Date" />
              <DatePickerWithPresets date={endDate} setDate={setEndDate} label="End Date" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="spotDuration">Spot Duration (seconds)</Label>
                <Input
                  id="spotDuration"
                  type="number"
                  min="0"
                  value={spotDuration}
                  onChange={(e) => setSpotDuration(parseInt(e.target.value) || 0)}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="totalSpots">Total Spots</Label>
                <Input
                  id="totalSpots"
                  type="number"
                  min="0"
                  value={totalSpots}
                  onChange={(e) => setTotalSpots(parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dailySpots">Daily Spots (optional)</Label>
                <Input
                  id="dailySpots"
                  type="number"
                  min="0"
                  value={dailySpots}
                  onChange={(e) => setDailySpots(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>Days of Week</Label>
              <div className="flex flex-wrap gap-2">
                {weekdays.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={daysOfWeek.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDayToggle(day.value)}
                  >
                    {day.label.slice(0, 3)}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="timeRestrictions">Time Restrictions (optional)</Label>
              <Textarea
                id="timeRestrictions"
                placeholder="e.g., Only during morning drive 6AM-10AM"
                value={timeRestrictions}
                onChange={(e) => setTimeRestrictions(e.target.value)}
                rows={2}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!startDate || !endDate}>
              {campaign ? 'Update Campaign' : 'Add Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const SpotDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  campaignId: number;
  onAddTrack: (trackId: number, name: string) => void;
}> = ({ isOpen, onClose, campaignId, onAddTrack }) => {
  // You'll need to integrate this with your audio track selection logic
  // For now, we'll mock this with a simple form
  const [name, setName] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrackId) {
      toast({
        title: "Error",
        description: "Please select an audio track",
        variant: "destructive",
      });
      return;
    }
    onAddTrack(selectedTrackId, name);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Commercial Spot</DialogTitle>
          <DialogDescription>
            Select an audio file to use as a commercial spot for this campaign
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="required">Spot Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Audio Track</Label>
              <div className="p-6 border-2 border-dashed rounded-md flex flex-col items-center justify-center">
                <FileAudio className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Select an audio track from your library or upload a new one
                </p>
                <Button type="button" variant="outline">
                  Browse Audio Tracks
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Note: To implement actual track selection, integrate this with your audio track browser component.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name}>
              Add Spot
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const SpotsList: React.FC<{
  spots: CommercialSpot[];
  onDeleteSpot: (spotId: number) => void;
}> = ({ spots, onDeleteSpot }) => {
  if (spots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border rounded-md text-muted-foreground">
        <FileAudio className="h-8 w-8 mb-2" />
        <p>No spots added to this campaign yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2">
        {spots.map((spot) => (
          <div key={spot.id} className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center">
              <FileAudio className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="font-medium">{spot.name}</p>
                <p className="text-sm text-muted-foreground">Track ID: {spot.trackId}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDeleteSpot(spot.id)}
            >
              <Trash className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

const ClientsTab: React.FC = () => {
  const { 
    clients, 
    isLoadingClients, 
    selectedClient, 
    setSelectedClient,
    createClient,
    updateClient,
    deleteClient,
  } = useTraffic();
  
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const { toast } = useToast();

  const handleAddClient = async (client: InsertCommercialClient) => {
    try {
      const newClient = await createClient(client);
      setSelectedClient(newClient);
      toast({
        title: "Client created",
        description: `${client.name} has been added successfully`,
      });
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const handleUpdateClient = async (client: InsertCommercialClient) => {
    if (!selectedClient) return;
    
    try {
      const updatedClient = await updateClient(selectedClient.id, client);
      setSelectedClient(updatedClient);
      toast({
        title: "Client updated",
        description: `${client.name} has been updated successfully`,
      });
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const handleDeleteClient = async (id: number) => {
    try {
      await deleteClient(id);
      if (selectedClient?.id === id) {
        setSelectedClient(null);
      }
      toast({
        title: "Client deleted",
        description: "The client has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      {/* Left column - Client list */}
      <Card className="col-span-1">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Clients</CardTitle>
            <Button onClick={() => setIsAddClientOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Client
            </Button>
          </div>
          <CardDescription>Manage advertising clients</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingClients ? (
            <div className="flex justify-center p-6">
              <p>Loading clients...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Users className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground mb-3">No clients found</p>
              <Button onClick={() => setIsAddClientOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Client
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-15rem)]">
              {clients.map((client) => (
                <ClientListItem 
                  key={client.id}
                  client={client}
                  isSelected={selectedClient?.id === client.id}
                  onClick={() => setSelectedClient(client)}
                  onDelete={() => handleDeleteClient(client.id)}
                  onEdit={() => {
                    setSelectedClient(client);
                    setIsEditClientOpen(true);
                  }}
                />
              ))}
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Right column - Client details */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>
            {selectedClient ? selectedClient.name : 'Client Details'}
          </CardTitle>
          <CardDescription>
            {selectedClient 
              ? 'View and manage client information and campaigns' 
              : 'Select a client from the list to view details'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedClient ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-lg font-medium mb-1">No Client Selected</p>
              <p className="text-sm text-muted-foreground mb-3">
                Select a client from the list to view their details and campaigns
              </p>
              <Button onClick={() => setIsAddClientOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add New Client
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contact Name</p>
                    <p>{selectedClient.contactName || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{selectedClient.contactEmail || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p>{selectedClient.contactPhone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p>{selectedClient.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditClientOpen(true)}>
                  <Edit className="h-4 w-4 mr-1" /> Edit Client
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Client Dialog */}
      <ClientDialog
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        onSubmit={handleAddClient}
      />

      {/* Edit Client Dialog */}
      {selectedClient && (
        <ClientDialog
          isOpen={isEditClientOpen}
          onClose={() => setIsEditClientOpen(false)}
          onSubmit={handleUpdateClient}
          client={selectedClient}
        />
      )}
    </div>
  );
};

const CampaignsTab: React.FC = () => {
  const { 
    clients,
    selectedClient,
    setSelectedClient,
    campaigns, 
    isLoadingCampaigns,
    selectedCampaign,
    setSelectedCampaign,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    spots,
    isLoadingSpots,
    createSpot,
    deleteSpot,
    generateCampaignReport,
    generateCampaignInvoice
  } = useTraffic();
  
  const [isAddCampaignOpen, setIsAddCampaignOpen] = useState(false);
  const [isEditCampaignOpen, setIsEditCampaignOpen] = useState(false);
  const [isAddSpotOpen, setIsAddSpotOpen] = useState(false);
  const { toast } = useToast();

  const filteredCampaigns = selectedClient 
    ? campaigns.filter(campaign => campaign.clientId === selectedClient.id)
    : campaigns;

  const handleAddCampaign = async (campaign: InsertCommercialCampaign) => {
    try {
      const newCampaign = await createCampaign(campaign);
      setSelectedCampaign(newCampaign);
      toast({
        title: "Campaign created",
        description: `${campaign.name} has been added successfully`,
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCampaign = async (campaign: InsertCommercialCampaign) => {
    if (!selectedCampaign) return;
    
    try {
      const updatedCampaign = await updateCampaign(selectedCampaign.id, campaign);
      setSelectedCampaign(updatedCampaign);
      toast({
        title: "Campaign updated",
        description: `${campaign.name} has been updated successfully`,
      });
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to update campaign",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCampaign = async (id: number) => {
    try {
      await deleteCampaign(id);
      if (selectedCampaign?.id === id) {
        setSelectedCampaign(null);
      }
      toast({
        title: "Campaign deleted",
        description: "The campaign has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    }
  };

  const handleAddSpot = async (trackId: number, name: string) => {
    if (!selectedCampaign) return;
    
    try {
      await createSpot(selectedCampaign.id, {
        campaignId: selectedCampaign.id,
        trackId,
        name,
        isActive: true,
        weight: 1
      });
      toast({
        title: "Spot added",
        description: `${name} has been added to the campaign`,
      });
    } catch (error) {
      console.error('Error adding spot:', error);
      toast({
        title: "Error",
        description: "Failed to add spot",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSpot = async (spotId: number) => {
    if (!selectedCampaign) return;
    
    try {
      await deleteSpot(selectedCampaign.id, spotId);
      toast({
        title: "Spot deleted",
        description: "The spot has been removed from the campaign",
      });
    } catch (error) {
      console.error('Error deleting spot:', error);
      toast({
        title: "Error",
        description: "Failed to delete spot",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReport = async (campaignId: number) => {
    try {
      await generateCampaignReport(campaignId);
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  const handleGenerateInvoice = async (campaignId: number) => {
    try {
      await generateCampaignInvoice(campaignId);
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      {/* Left column - Campaign list */}
      <Card className="col-span-1">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Campaigns</CardTitle>
            <Button 
              onClick={() => {
                if (!selectedClient) {
                  toast({
                    title: "Select a client",
                    description: "Please select a client before creating a campaign",
                    variant: "destructive",
                  });
                  return;
                }
                setIsAddCampaignOpen(true);
              }} 
              size="sm"
              disabled={!selectedClient}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Campaign
            </Button>
          </div>
          <CardDescription>
            {selectedClient 
              ? `Campaigns for ${selectedClient.name}` 
              : 'Select a client to view campaigns'}
          </CardDescription>
          
          {clients.length > 0 && (
            <div className="pt-2">
              <Select 
                value={selectedClient?.id?.toString() || "all"} 
                onValueChange={(value) => {
                  if (value === "all") {
                    setSelectedClient(null);
                  } else {
                    const client = clients.find(c => c.id === parseInt(value));
                    if (client) setSelectedClient(client);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingCampaigns ? (
            <div className="flex justify-center p-6">
              <p>Loading campaigns...</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Megaphone className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground mb-3">No campaigns found</p>
              {selectedClient && (
                <Button onClick={() => setIsAddCampaignOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Campaign
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-20rem)]">
              {filteredCampaigns.map((campaign) => (
                <CampaignListItem 
                  key={campaign.id}
                  campaign={campaign}
                  isSelected={selectedCampaign?.id === campaign.id}
                  onClick={() => setSelectedCampaign(campaign)}
                  onDelete={() => handleDeleteCampaign(campaign.id)}
                  onEdit={() => {
                    setSelectedCampaign(campaign);
                    setIsEditCampaignOpen(true);
                  }}
                  onReport={() => handleGenerateReport(campaign.id)}
                  onInvoice={() => handleGenerateInvoice(campaign.id)}
                />
              ))}
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Right column - Campaign details & spots */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>
            {selectedCampaign ? selectedCampaign.name : 'Campaign Details'}
          </CardTitle>
          <CardDescription>
            {selectedCampaign 
              ? 'Manage campaign information and commercial spots' 
              : 'Select a campaign from the list to view details'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedCampaign ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-lg font-medium mb-1">No Campaign Selected</p>
              <p className="text-sm text-muted-foreground mb-3">
                Select a campaign from the list to view details and manage spots
              </p>
              {selectedClient && (
                <Button onClick={() => setIsAddCampaignOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add New Campaign
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Campaign Info</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge 
                        className={`mt-1 ${
                          selectedCampaign.status === 'active' ? 'bg-green-500' :
                          selectedCampaign.status === 'pending' ? 'bg-yellow-500' :
                          selectedCampaign.status === 'completed' ? 'bg-blue-500' :
                          'bg-red-500'
                        }`}
                      >
                        {selectedCampaign.status.charAt(0).toUpperCase() + selectedCampaign.status.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Client</p>
                      <p>{clients.find(c => c.id === selectedCampaign.clientId)?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date Range</p>
                      <p>
                        {format(new Date(selectedCampaign.startDate), 'MMM d, yyyy')} - {format(new Date(selectedCampaign.endDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Days</p>
                      <p>{selectedCampaign.daysOfWeek?.length ? selectedCampaign.daysOfWeek.map(d => d.slice(0, 3)).join(', ') : 'All days'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Spot Details</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Spots</p>
                      <p>{selectedCampaign.totalSpots}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Daily Spots</p>
                      <p>{selectedCampaign.dailySpots || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Spot Duration</p>
                      <p>{selectedCampaign.spotDuration} seconds</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Time Restrictions</p>
                      <p>{selectedCampaign.timeRestrictions || 'None'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedCampaign.notes && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Notes</h3>
                  <p className="text-sm">{selectedCampaign.notes}</p>
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Commercial Spots</h3>
                  <Button onClick={() => setIsAddSpotOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add Spot
                  </Button>
                </div>
                
                {isLoadingSpots ? (
                  <div className="flex justify-center py-4">
                    <p>Loading spots...</p>
                  </div>
                ) : (
                  <SpotsList 
                    spots={spots} 
                    onDeleteSpot={handleDeleteSpot}
                  />
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => handleGenerateReport(selectedCampaign.id)}>
                    <BarChart className="h-4 w-4 mr-1" /> Generate Report
                  </Button>
                  <Button variant="outline" onClick={() => handleGenerateInvoice(selectedCampaign.id)}>
                    <FileText className="h-4 w-4 mr-1" /> Generate Invoice
                  </Button>
                </div>
                <Button variant="outline" onClick={() => setIsEditCampaignOpen(true)}>
                  <Edit className="h-4 w-4 mr-1" /> Edit Campaign
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Campaign Dialog */}
      {selectedClient && (
        <CampaignDialog
          isOpen={isAddCampaignOpen}
          onClose={() => setIsAddCampaignOpen(false)}
          onSubmit={handleAddCampaign}
          clientId={selectedClient.id}
        />
      )}

      {/* Edit Campaign Dialog */}
      {selectedCampaign && (
        <CampaignDialog
          isOpen={isEditCampaignOpen}
          onClose={() => setIsEditCampaignOpen(false)}
          onSubmit={handleUpdateCampaign}
          campaign={selectedCampaign}
          clientId={selectedCampaign.clientId}
        />
      )}

      {/* Add Spot Dialog */}
      {selectedCampaign && (
        <SpotDialog
          isOpen={isAddSpotOpen}
          onClose={() => setIsAddSpotOpen(false)}
          campaignId={selectedCampaign.id}
          onAddTrack={handleAddSpot}
        />
      )}
    </div>
  );
};

const ScheduleTab: React.FC = () => {
  const { campaigns } = useTraffic();
  
  // This tab will show the schedule of commercials
  return (
    <Card>
      <CardHeader>
        <CardTitle>Commercial Schedule</CardTitle>
        <CardDescription>View and manage your commercial playback schedule</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-lg font-medium mb-1">Schedule Management</p>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            This section will allow you to manage the scheduling of commercials in your programming.
            You will be able to view upcoming spots, define break schedules, and configure automation rules.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-1" /> View Calendar
            </Button>
            <Button variant="outline">
              <ListFilter className="h-4 w-4 mr-1" /> Configure Schedule Rules
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ReportsTab: React.FC = () => {
  // This tab will show reports and revenue tracking
  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Reports</CardTitle>
        <CardDescription>Track campaign performance and revenue</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <BarChart className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-lg font-medium mb-1">Reports & Analytics</p>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            This section will provide detailed reports on your commercial traffic,
            including playback counts, revenue analysis, and campaign performance metrics.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline">
              <BarChart className="h-4 w-4 mr-1" /> Revenue Report
            </Button>
            <Button variant="outline">
              <DollarSign className="h-4 w-4 mr-1" /> Financial Overview
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TrafficPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of the system",
        });
        setLocation('/');
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

// Invoicing Tab for PDF export invoicing functionality
const InvoicingTab: React.FC = () => {
  const { 
    clients, 
    isLoadingClients,
    campaigns,
    isLoadingCampaigns,
    generateCampaignInvoice
  } = useTraffic();
  
  const [clientFilter, setClientFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [invoiceData, setInvoiceData] = useState<{
    client: CommercialClient | null;
    campaign: CommercialCampaign | null;
    vatRate: number;
    discount: number;
    additionalInfo: string;
  }>({
    client: null,
    campaign: null,
    vatRate: 5,
    discount: 0,
    additionalInfo: ''
  });
  
  // Filter campaigns by client and search query
  const filteredCampaigns = campaigns
    .filter(campaign => !clientFilter || campaign.clientId === clientFilter)
    .filter(campaign => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const matchClient = clients.find(c => c.id === campaign.clientId);
      return (
        campaign.name.toLowerCase().includes(query) ||
        (matchClient && matchClient.name.toLowerCase().includes(query)) ||
        campaign.status.toLowerCase().includes(query)
      );
    });
  
  const handleGenerateInvoice = async () => {
    if (!invoiceData.campaign || !invoiceData.client) {
      return;
    }
    
    try {
      await generateCampaignInvoice(invoiceData.campaign.id);
      // Reset the form after generating the invoice
      setInvoiceData({
        client: null,
        campaign: null,
        vatRate: 5,
        discount: 0,
        additionalInfo: ''
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
    }
  };
  
  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };
  
  const calculateTotals = () => {
    if (!invoiceData.campaign) {
      return { subtotal: 0, vat: 0, discount: 0, total: 0 };
    }
    
    const spotCost = invoiceData.campaign.totalSpots * 100; // Assuming 100 per spot for demo
    const subtotal = spotCost;
    const discount = subtotal * (invoiceData.discount / 100);
    const afterDiscount = subtotal - discount;
    const vat = afterDiscount * (invoiceData.vatRate / 100);
    const total = afterDiscount + vat;
    
    return {
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      vat: vat.toFixed(2),
      total: total.toFixed(2)
    };
  };
  
  const totals = calculateTotals();
  
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left column - Invoice Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Generator</CardTitle>
          <CardDescription>Create and export invoices for clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="clientSelect">Select Client</Label>
              <Select
                value={invoiceData.client?.id?.toString() || ''}
                onValueChange={(value) => {
                  const selectedClient = clients.find(c => c.id === parseInt(value));
                  setInvoiceData({
                    ...invoiceData,
                    client: selectedClient || null,
                    campaign: null // Reset campaign when client changes
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="campaignSelect">Select Campaign</Label>
              <Select
                value={invoiceData.campaign?.id?.toString() || ''}
                onValueChange={(value) => {
                  const selectedCampaign = campaigns.find(c => c.id === parseInt(value));
                  setInvoiceData({
                    ...invoiceData,
                    campaign: selectedCampaign || null
                  });
                }}
                disabled={!invoiceData.client}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns
                    .filter(campaign => campaign.clientId === invoiceData.client?.id)
                    .map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id.toString()}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vatRate">VAT Rate (%)</Label>
                <Input
                  id="vatRate"
                  type="number"
                  min="0"
                  max="100"
                  value={invoiceData.vatRate}
                  onChange={(e) => setInvoiceData({
                    ...invoiceData,
                    vatRate: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={invoiceData.discount}
                  onChange={(e) => setInvoiceData({
                    ...invoiceData,
                    discount: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Textarea
                id="additionalInfo"
                placeholder="Payment details, terms and conditions, etc."
                value={invoiceData.additionalInfo}
                onChange={(e) => setInvoiceData({
                  ...invoiceData,
                  additionalInfo: e.target.value
                })}
                rows={3}
              />
            </div>
            
            {invoiceData.campaign && (
              <div className="border rounded-md p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                <h3 className="font-medium">Invoice Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Campaign:</div>
                  <div>{invoiceData.campaign.name}</div>
                  
                  <div className="text-muted-foreground">Spots:</div>
                  <div>{invoiceData.campaign.totalSpots}</div>
                  
                  <div className="text-muted-foreground">Subtotal:</div>
                  <div>${totals.subtotal}</div>
                  
                  <div className="text-muted-foreground">Discount ({invoiceData.discount}%):</div>
                  <div>-${totals.discount}</div>
                  
                  <div className="text-muted-foreground">VAT ({invoiceData.vatRate}%):</div>
                  <div>${totals.vat}</div>
                  
                  <div className="font-medium">Total:</div>
                  <div className="font-medium">${totals.total}</div>
                </div>
              </div>
            )}
            
            <Button 
              className="w-full" 
              onClick={handleGenerateInvoice}
              disabled={!invoiceData.campaign || !invoiceData.client}
            >
              <FileText className="h-4 w-4 mr-2" /> Generate PDF Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Right column - Campaign Listing */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Campaigns</CardTitle>
            <div className="flex space-x-2">
              <Select 
                value={clientFilter?.toString() || ''} 
                onValueChange={(val) => setClientFilter(val ? parseInt(val) : null)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex mt-2">
            <Input
              placeholder="Search campaigns or clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingCampaigns ? (
            <div className="flex justify-center p-6">
              <p>Loading campaigns...</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <FileText className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground mb-3">No campaigns found</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="divide-y">
                {filteredCampaigns.map((campaign) => (
                  <div 
                    key={campaign.id} 
                    className="p-4 hover:bg-accent/50 cursor-pointer"
                    onClick={() => {
                      const client = clients.find(c => c.id === campaign.clientId);
                      setInvoiceData({
                        ...invoiceData,
                        client: client || null,
                        campaign
                      });
                    }}
                  >
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">{campaign.name}</h4>
                        <p className="text-sm text-muted-foreground">{getClientName(campaign.clientId)}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge variant={
                          campaign.status === 'active' ? 'default' :
                          campaign.status === 'completed' ? 'secondary' :
                          campaign.status === 'pending' ? 'outline' : 'destructive'
                        }>
                          {campaign.status}
                        </Badge>
                        <span className="text-sm mt-1">
                          {campaign.totalSpots} spots
                        </span>
                      </div>
                    </div>
                    <div className="flex mt-2 justify-between text-xs text-muted-foreground">
                      <span>
                        {format(new Date(campaign.startDate), 'MMM d, yyyy')} - 
                        {format(new Date(campaign.endDate), 'MMM d, yyyy')}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2" 
                        onClick={(e) => {
                          e.stopPropagation();
                          generateCampaignInvoice(campaign.id);
                        }}
                      >
                        <FileText className="h-3 w-3 mr-1" /> Invoice
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; // End of InvoicingTab component

// Continuing TrafficPage component render function
return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Traffic Management</h1>
            <p className="text-muted-foreground">
              Manage clients, commercial campaigns, scheduling, and traffic reports
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center">
              <Button variant="outline" className="gap-1">
                <Home size={16} /> Home
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={handleLogout}
            >
              <LogOut size={16} /> Logout
            </Button>
          </div>
        </div>
        
        <TrafficProvider>
          <RadioAutomationProvider>
            <Tabs defaultValue="clients" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="clients">
                  <Users className="h-4 w-4 mr-2" /> Clients
                </TabsTrigger>
                <TabsTrigger value="campaigns">
                  <Megaphone className="h-4 w-4 mr-2" /> Campaigns
                </TabsTrigger>
                <TabsTrigger value="schedule">
                  <Calendar className="h-4 w-4 mr-2" /> Schedule
                </TabsTrigger>
                <TabsTrigger value="invoicing">
                  <FileText className="h-4 w-4 mr-2" /> Invoicing
                </TabsTrigger>
                <TabsTrigger value="reports">
                  <BarChart className="h-4 w-4 mr-2" /> Reports
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="clients" className="space-y-4">
                <ClientsTab />
              </TabsContent>
              
              <TabsContent value="campaigns" className="space-y-4">
                <CampaignsTab />
              </TabsContent>
              
              <TabsContent value="schedule" className="space-y-4">
                <ScheduleTab />
              </TabsContent>
              
              <TabsContent value="invoicing" className="space-y-4">
                <InvoicingTab />
              </TabsContent>
              
              <TabsContent value="reports" className="space-y-4">
                <ReportsTab />
              </TabsContent>
            </Tabs>
          </RadioAutomationProvider>
        </TrafficProvider>
      </div>
    </div>
  );
};
export default TrafficPage;