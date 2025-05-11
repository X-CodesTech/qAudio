import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, StudioTheme } from '@/contexts/ThemeContext';
import { Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Paintbrush, Trash2, Save, Plus, Check, RotateCcw, ChevronLeft } from 'lucide-react';
import AdminViewTabs from '@/components/AdminViewTabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

type ColorPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`color-${label.toLowerCase().replace(/\s+/g, '-')}`}>{label}</Label>
      <div className="flex gap-2 items-center">
        <div 
          className="w-6 h-6 rounded-md border" 
          style={{ backgroundColor: value }}
        />
        <Input
          id={`color-${label.toLowerCase().replace(/\s+/g, '-')}`}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full"
        />
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 p-0 border-0 cursor-pointer"
        />
      </div>
    </div>
  );
};

// Component for previewing a theme
const ThemePreview: React.FC<{ theme: StudioTheme }> = ({ theme }) => {
  return (
    <div className={`${theme.darkMode ? 'bg-zinc-900' : 'bg-gray-100'} p-4 rounded-md`}>
      <div className="flex gap-4 mb-4">
        {/* Studio A Card Preview */}
        <div
          className="flex-1 rounded-md p-3 shadow-md"
          style={{ 
            backgroundColor: theme.darkMode ? theme.global.surface : '#ffffff',
            borderWidth: '1px',
            borderColor: theme.darkMode ? theme.global.border : '#e5e7eb',
            color: theme.darkMode ? theme.global.text : '#111827'
          }}
        >
          <div 
            className="font-bold text-lg mb-2"
            style={{ color: theme.studioA.primary }}
          >
            STUDIO A
          </div>
          <div 
            className="h-2 rounded-full mb-2"
            style={{ backgroundColor: theme.studioA.primary }}
          ></div>
          <div className="flex justify-between">
            <div 
              className="px-2 py-1 rounded-md text-xs font-medium"
              style={{ 
                backgroundColor: theme.studioA.secondary,
                color: '#ffffff'
              }}
            >
              Button
            </div>
            <div 
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: theme.studioA.primary }}
            ></div>
          </div>
        </div>
        
        {/* Studio B Card Preview */}
        <div
          className="flex-1 rounded-md p-3 shadow-md"
          style={{ 
            backgroundColor: theme.darkMode ? theme.global.surface : '#ffffff',
            borderWidth: '1px',
            borderColor: theme.darkMode ? theme.global.border : '#e5e7eb',
            color: theme.darkMode ? theme.global.text : '#111827'
          }}
        >
          <div 
            className="font-bold text-lg mb-2"
            style={{ color: theme.studioB.primary }}
          >
            STUDIO B
          </div>
          <div 
            className="h-2 rounded-full mb-2"
            style={{ backgroundColor: theme.studioB.primary }}
          ></div>
          <div className="flex justify-between">
            <div 
              className="px-2 py-1 rounded-md text-xs font-medium"
              style={{ 
                backgroundColor: theme.studioB.secondary,
                color: '#ffffff'
              }}
            >
              Button
            </div>
            <div 
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: theme.studioB.primary }}
            ></div>
          </div>
        </div>
      </div>
      
      <div 
        className="text-xs mt-2 text-center"
        style={{ 
          color: theme.darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
        }}
      >
        {theme.name} ({theme.darkMode ? 'Dark Mode' : 'Light Mode'})
      </div>
    </div>
  );
};

const ThemeCreatorPage: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { currentTheme, themes, setTheme, createTheme, updateTheme, deleteTheme } = useTheme();
  
  // Working copies of theme
  const [editingTheme, setEditingTheme] = useState<StudioTheme>(currentTheme);
  const [editMode, setEditMode] = useState<'edit' | 'create'>('edit');
  const [showNewThemeDialog, setShowNewThemeDialog] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [baseThemeId, setBaseThemeId] = useState(currentTheme.id);
  
  // Update editing theme when current theme changes
  useEffect(() => {
    if (editMode === 'edit') {
      setEditingTheme(currentTheme);
    }
  }, [currentTheme, editMode]);
  
  const handleThemeChange = (themeId: string) => {
    setTheme(themeId);
    setEditMode('edit');
  };
  
  const handleSaveTheme = () => {
    if (editMode === 'edit') {
      updateTheme(editingTheme);
      toast({
        title: t('themeCreator.themeSaved') || 'Theme saved',
        description: t('themeCreator.themeUpdated', { name: editingTheme.name }) || 
          `The theme "${editingTheme.name}" has been updated.`,
      });
    } else {
      createTheme(editingTheme);
      setEditMode('edit');
      toast({
        title: t('themeCreator.themeCreated') || 'Theme created',
        description: t('themeCreator.newThemeCreated', { name: editingTheme.name }) || 
          `The new theme "${editingTheme.name}" has been created.`,
      });
    }
  };
  
  const handleDeleteTheme = () => {
    if (editingTheme.id === 'default' || 
        editingTheme.id === 'professional' || 
        editingTheme.id === 'vintage' || 
        editingTheme.id === 'light') {
      toast({
        title: t('themeCreator.cannotDelete') || 'Cannot delete',
        description: t('themeCreator.defaultThemeError') || 'Default themes cannot be deleted.',
        variant: 'destructive',
      });
      return;
    }
    
    deleteTheme(editingTheme.id);
    toast({
      title: t('themeCreator.themeDeleted') || 'Theme deleted',
      description: t('themeCreator.themeRemoved', { name: editingTheme.name }) || 
        `The theme "${editingTheme.name}" has been deleted.`,
    });
  };
  
  const handleCreateNewTheme = () => {
    if (!newThemeName.trim()) {
      toast({
        title: t('themeCreator.nameRequired') || 'Name required',
        description: t('themeCreator.pleaseEnterName') || 'Please enter a name for your theme.',
        variant: 'destructive',
      });
      return;
    }
    
    const baseTheme = themes.find(t => t.id === baseThemeId) || themes[0];
    
    setEditingTheme({
      ...baseTheme,
      id: '', // Will be generated when saved
      name: newThemeName,
    });
    
    setEditMode('create');
    setShowNewThemeDialog(false);
    setNewThemeName('');
  };
  
  const resetToCurrentTheme = () => {
    setEditingTheme(currentTheme);
    setEditMode('edit');
    toast({
      title: t('themeCreator.changesDiscarded') || 'Changes discarded',
      description: t('themeCreator.restoredOriginal') || 'Restored to the original theme settings.',
    });
  };
  
  // Update a specific color in the theme
  const updateThemeColor = (
    section: 'studioA' | 'studioB' | 'global', 
    property: string, 
    value: string
  ) => {
    setEditingTheme(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [property]: value
      }
    }));
  };
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setEditingTheme(prev => ({
      ...prev,
      darkMode: !prev.darkMode,
      global: {
        ...prev.global,
        background: !prev.darkMode ? '#f8fafc' : '#18181b', // Light/dark background
        text: !prev.darkMode ? '#0f172a' : '#ffffff',       // Light/dark text
        surface: !prev.darkMode ? '#f1f5f9' : '#27272a',    // Light/dark surface
        border: !prev.darkMode ? '#cbd5e1' : '#3f3f46',     // Light/dark border
      }
    }));
  };
  
  const isDefaultTheme = 
    editingTheme.id === 'default' || 
    editingTheme.id === 'professional' || 
    editingTheme.id === 'vintage' || 
    editingTheme.id === 'light';
  
  const hasUnsavedChanges = 
    editMode === 'create' || 
    JSON.stringify(editingTheme) !== JSON.stringify(currentTheme);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="outline" size="sm" className="flex items-center">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Settings
            </Button>
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Paintbrush className="h-6 w-6" />
            {t('themeCreator.title') || 'Studio Theme Creator'}
          </h1>
          
          {/* Admin navigation tabs */}
          <div className="ml-4">
            <AdminViewTabs />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showNewThemeDialog} onOpenChange={setShowNewThemeDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                {t('themeCreator.newTheme') || 'New Theme'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('themeCreator.createNewTheme') || 'Create New Theme'}</DialogTitle>
                <DialogDescription>
                  {t('themeCreator.themeDescription') || 'Create a custom theme by starting from one of the existing themes.'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-theme-name">{t('themeCreator.themeName') || 'Theme Name'}</Label>
                  <Input
                    id="new-theme-name"
                    value={newThemeName}
                    onChange={(e) => setNewThemeName(e.target.value)}
                    placeholder={t('themeCreator.enterThemeName') || 'Enter theme name...'}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="base-theme">{t('themeCreator.basedOn') || 'Based On'}</Label>
                  <Select value={baseThemeId} onValueChange={setBaseThemeId}>
                    <SelectTrigger id="base-theme">
                      <SelectValue placeholder={t('themeCreator.selectBaseTheme') || 'Select base theme'} />
                    </SelectTrigger>
                    <SelectContent>
                      {themes.map(theme => (
                        <SelectItem key={theme.id} value={theme.id}>
                          {theme.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewThemeDialog(false)}>
                  {t('common.cancel') || 'Cancel'}
                </Button>
                <Button onClick={handleCreateNewTheme}>
                  {t('themeCreator.create') || 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {hasUnsavedChanges && (
            <Button variant="outline" onClick={resetToCurrentTheme} className="flex items-center gap-1">
              <RotateCcw className="h-4 w-4" />
              {t('common.reset') || 'Reset'}
            </Button>
          )}
          
          <Button 
            onClick={handleSaveTheme} 
            disabled={!hasUnsavedChanges}
            className="flex items-center gap-1"
          >
            <Save className="h-4 w-4" />
            {t('common.save') || 'Save'}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('themeCreator.editTheme') || 'Edit Theme'}</CardTitle>
              <CardDescription>
                {t('themeCreator.customizeStudioAppearance') || 'Customize the appearance of your studio interface'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="studio-a" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="studio-a">{t('themeCreator.studioA') || 'Studio A'}</TabsTrigger>
                  <TabsTrigger value="studio-b">{t('themeCreator.studioB') || 'Studio B'}</TabsTrigger>
                  <TabsTrigger value="global">{t('themeCreator.global') || 'Global'}</TabsTrigger>
                </TabsList>
                
                {/* Studio A Theme Options */}
                <TabsContent value="studio-a" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ColorPicker
                      label={t('themeCreator.primaryColor') || 'Primary Color'}
                      value={editingTheme.studioA.primary}
                      onChange={(value) => updateThemeColor('studioA', 'primary', value)}
                    />
                    <ColorPicker
                      label={t('themeCreator.secondaryColor') || 'Secondary Color'}
                      value={editingTheme.studioA.secondary}
                      onChange={(value) => updateThemeColor('studioA', 'secondary', value)}
                    />
                    <ColorPicker
                      label={t('themeCreator.accentColor') || 'Accent Color'}
                      value={editingTheme.studioA.accent}
                      onChange={(value) => updateThemeColor('studioA', 'accent', value)}
                    />
                  </div>
                </TabsContent>
                
                {/* Studio B Theme Options */}
                <TabsContent value="studio-b" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ColorPicker
                      label={t('themeCreator.primaryColor') || 'Primary Color'}
                      value={editingTheme.studioB.primary}
                      onChange={(value) => updateThemeColor('studioB', 'primary', value)}
                    />
                    <ColorPicker
                      label={t('themeCreator.secondaryColor') || 'Secondary Color'}
                      value={editingTheme.studioB.secondary}
                      onChange={(value) => updateThemeColor('studioB', 'secondary', value)}
                    />
                    <ColorPicker
                      label={t('themeCreator.accentColor') || 'Accent Color'}
                      value={editingTheme.studioB.accent}
                      onChange={(value) => updateThemeColor('studioB', 'accent', value)}
                    />
                  </div>
                </TabsContent>
                
                {/* Global Theme Options */}
                <TabsContent value="global" className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="dark-mode"
                      checked={editingTheme.darkMode}
                      onCheckedChange={toggleDarkMode}
                    />
                    <Label htmlFor="dark-mode">
                      {editingTheme.darkMode 
                        ? (t('themeCreator.darkMode') || 'Dark Mode') 
                        : (t('themeCreator.lightMode') || 'Light Mode')}
                    </Label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColorPicker
                      label={t('themeCreator.backgroundColor') || 'Background Color'}
                      value={editingTheme.global.background}
                      onChange={(value) => updateThemeColor('global', 'background', value)}
                    />
                    <ColorPicker
                      label={t('themeCreator.textColor') || 'Text Color'}
                      value={editingTheme.global.text}
                      onChange={(value) => updateThemeColor('global', 'text', value)}
                    />
                    <ColorPicker
                      label={t('themeCreator.surfaceColor') || 'Surface Color'}
                      value={editingTheme.global.surface}
                      onChange={(value) => updateThemeColor('global', 'surface', value)}
                    />
                    <ColorPicker
                      label={t('themeCreator.borderColor') || 'Border Color'}
                      value={editingTheme.global.border}
                      onChange={(value) => updateThemeColor('global', 'border', value)}
                    />
                  </div>
                  
                  {!isDefaultTheme && (
                    <div className="mt-8 pt-6 border-t border-border">
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteTheme}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('themeCreator.deleteTheme') || 'Delete Theme'}
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t('themeCreator.preview') || 'Preview'}</CardTitle>
              <CardDescription>
                {t('themeCreator.previewThemeChanges') || 'Preview how your theme will look like'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ThemePreview theme={editingTheme} />
              
              <div className="mt-4 space-y-2">
                <Label htmlFor="active-theme">{t('themeCreator.selectTheme') || 'Select Theme'}</Label>
                <Select 
                  value={editMode === 'edit' ? editingTheme.id : ''}
                  onValueChange={handleThemeChange}
                  disabled={editMode === 'create'}
                >
                  <SelectTrigger id="active-theme">
                    <SelectValue 
                      placeholder={
                        editMode === 'create' 
                          ? t('themeCreator.unsavedTheme') || 'Unsaved Theme' 
                          : t('themeCreator.selectTheme') || 'Select theme'
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {themes.map(theme => (
                      <SelectItem key={theme.id} value={theme.id}>
                        {theme.name}
                        {theme.id === currentTheme.id && (
                          <Check className="ml-2 h-4 w-4 inline" />
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>{t('themeCreator.savedThemes') || 'Saved Themes'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {themes.slice(0, 8).map(theme => (
                  <Button
                    key={theme.id}
                    variant={theme.id === currentTheme.id ? "default" : "outline"}
                    className="justify-start p-2 h-auto"
                    onClick={() => handleThemeChange(theme.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ 
                          background: `linear-gradient(135deg, ${theme.studioA.primary} 0%, ${theme.studioB.primary} 100%)` 
                        }}
                      />
                      <span className="text-xs truncate max-w-[100px]">{theme.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ThemeCreatorPage;