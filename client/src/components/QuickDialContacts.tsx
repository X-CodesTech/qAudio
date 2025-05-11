import { useState, useEffect } from 'react';
import { useVoIP } from '@/hooks/useVoIP';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Search, User, MapPin, MessageSquare, Plus, BookOpen, Trash2, AlertCircle } from 'lucide-react';
import { Contact } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function QuickDialContacts() {
  const { callLines, makeOutboundCall } = useVoIP();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Get contacts from API
  const { data: contacts = [], isLoading, refetch } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
    refetchOnWindowFocus: false,
  });
  
  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      const response = await apiRequest('DELETE', `/api/contacts/${contactId}`);
      return response.ok;
    },
    onSuccess: () => {
      // Invalidate the contacts query to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: 'Contact Deleted',
        description: `${contactToDelete?.name} has been removed from your phone book.`,
      });
      // Close the dialog and reset
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting contact:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete the contact. Please try again.',
        variant: 'destructive',
      });
      setDeleteDialogOpen(false);
    }
  });
  
  // Find an available line
  const availableLines = callLines.filter(line => line.status === 'inactive');
  
  // Filter contacts based on search query
  const filteredContacts = searchQuery.trim() !== '' 
    ? contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        contact.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (contact.location && contact.location.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : contacts;
  
  const handleQuickDial = (phoneNumber: string) => {
    if (!selectedLine && availableLines.length === 0) {
      toast({
        title: 'No Lines Available',
        description: 'Hang up a call to free a line first.',
        variant: 'destructive'
      });
      return;
    }
    
    // Use selected line or first available line
    const lineId = selectedLine || availableLines[0].id;
    makeOutboundCall(lineId, phoneNumber);
    
    toast({
      title: 'Call Started',
      description: `Calling ${phoneNumber} on line ${lineId}`,
    });
  };
  
  // Refetch contacts whenever component mounts to ensure we have latest data
  useEffect(() => {
    refetch();
  }, [refetch]);
  
  return (
    <div className="relative">
      <Tabs defaultValue="contacts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="contacts" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            Phone Book
          </TabsTrigger>
          <TabsTrigger value="dial" className="flex items-center gap-1">
            <Phone className="h-4 w-4" />
            Recent Calls
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="contacts" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Card className="border-zinc-200">
            <CardHeader className="bg-zinc-100 p-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Contacts ({filteredContacts.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[250px]">
              <ScrollArea className="h-full">
                <div className="divide-y">
                  {isLoading ? (
                    <div className="p-4 text-center text-gray-500">Loading contacts...</div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {searchQuery ? 'No contacts match your search' : 'No contacts found'}
                    </div>
                  ) : (
                    filteredContacts.map(contact => (
                      <div 
                        key={contact.id} 
                        className="p-3 hover:bg-zinc-50 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium flex items-center">
                            <User className="h-3.5 w-3.5 mr-1 text-zinc-500" />
                            {contact.name}
                          </div>
                          {contact.location && (
                            <div className="text-xs text-zinc-500 flex items-center mt-0.5">
                              <MapPin className="h-3 w-3 mr-1" />
                              {contact.location}
                            </div>
                          )}
                          <div className="text-sm text-zinc-700 flex items-center mt-1">
                            <Phone className="h-3.5 w-3.5 mr-1 text-zinc-500" />
                            {contact.phone}
                          </div>
                          {contact.notes && (
                            <div className="text-xs text-zinc-500 flex items-start mt-1">
                              <MessageSquare className="h-3 w-3 mr-1 mt-0.5" />
                              <span className="line-clamp-1">{contact.notes}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => {
                              setContactToDelete(contact);
                              setDeleteDialogOpen(true);
                            }}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleQuickDial(contact.phone)}
                            disabled={availableLines.length === 0}
                            className="bg-status-active hover:bg-green-700 text-white"
                            size="sm"
                          >
                            <Phone className="h-3.5 w-3.5 mr-1" />
                            Call
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          
          {availableLines.length === 0 && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">
              No lines available. Hang up a call to free a line.
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="dial">
          <Card>
            <CardHeader className="bg-zinc-100 p-3">
              <CardTitle className="text-sm font-medium">Recent Calls</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-center text-zinc-500 py-8">
                <Phone className="h-8 w-8 mx-auto mb-2 text-zinc-300" />
                <p>Call history will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              Delete Contact
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{contactToDelete?.name}</strong>?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (contactToDelete) {
                  deleteContactMutation.mutate(contactToDelete.id);
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}