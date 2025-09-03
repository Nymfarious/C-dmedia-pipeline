import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EditPanel } from './EditPanel';
import { 
  Layers, 
  Image, 
  History, 
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Wand2
} from 'lucide-react';
import { Asset, ImageEditParams } from '@/types/media';

interface RightSidebarProps {
  selectedAsset?: Asset | null;
  onEditComplete?: (params: ImageEditParams) => Promise<void>;
}

export function RightSidebar({ selectedAsset, onEditComplete }: RightSidebarProps) {
  return (
    <div className="w-80 border-l border-border bg-card">
      <Tabs defaultValue="edit" className="h-full flex flex-col">
        <div className="p-4 pb-0">
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger value="edit" className="text-xs">
              <Wand2 className="h-4 w-4 mr-1" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="layers" className="text-xs">
              <Layers className="h-4 w-4 mr-1" />
              Layers
            </TabsTrigger>
            <TabsTrigger value="properties" className="text-xs">
              <Settings className="h-4 w-4 mr-1" />
              Properties
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="edit" className="m-0 h-full">
            <ScrollArea className="h-full p-4">
            {selectedAsset ? (
              <EditPanel 
                selectedAsset={selectedAsset}
                onEditComplete={onEditComplete || (async () => {})}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Select an asset to edit
              </div>
            )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="layers" className="m-0 h-full">
            <ScrollArea className="h-full p-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-foreground mb-3">Layers</h3>
              
              {/* Background Layer */}
              <Card className="bg-background">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-muted rounded border"></div>
                      <span className="text-sm text-foreground">Background</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Unlock className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Text Layer */}
              <Card className="bg-background">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded border"></div>
                      <span className="text-sm text-foreground">Text Layer</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Unlock className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shape Layer */}
              <Card className="bg-background">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-accent rounded border"></div>
                      <span className="text-sm text-foreground">Shape</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Unlock className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="properties" className="m-0 h-full">
            <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-foreground">Properties</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Width</label>
                  <div className="text-sm text-foreground">1920px</div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Height</label>
                  <div className="text-sm text-foreground">1080px</div>
                </div>
                <Separator />
                <div>
                  <label className="text-xs text-muted-foreground">Background</label>
                  <div className="text-sm text-foreground">#1a1a1a</div>
                </div>
              </div>
            </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}