import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Layers, 
  Image, 
  History, 
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock
} from 'lucide-react';

export function RightSidebar() {
  return (
    <div className="w-80 border-l border-border bg-card">
      <Tabs defaultValue="layers" className="h-full flex flex-col">
        <div className="p-4 pb-0">
          <TabsList className="grid w-full grid-cols-4 bg-muted">
            <TabsTrigger value="layers" className="text-xs">
              <Layers className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="assets" className="text-xs">
              <Image className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              <History className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="properties" className="text-xs">
              <Settings className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="layers" className="m-0 p-4">
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
          </TabsContent>

          <TabsContent value="assets" className="m-0 p-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-foreground">Assets</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-square bg-muted rounded border-2 border-dashed border-border flex items-center justify-center">
                  <Image className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="aspect-square bg-muted rounded border-2 border-dashed border-border flex items-center justify-center">
                  <Image className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="m-0 p-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-foreground mb-3">History</h3>
              <div className="space-y-1">
                <div className="text-sm text-foreground bg-primary/10 p-2 rounded">Initial canvas</div>
                <div className="text-sm text-muted-foreground p-2 rounded hover:bg-muted/50 cursor-pointer">Add text layer</div>
                <div className="text-sm text-muted-foreground p-2 rounded hover:bg-muted/50 cursor-pointer">Resize shape</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="properties" className="m-0 p-4">
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
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}