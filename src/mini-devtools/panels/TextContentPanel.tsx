import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, FileJson } from 'lucide-react';
import { logDevEvent } from '../stores/devLogsStore';
import { useIsMobile } from '@/hooks/use-mobile';

interface PageData {
  id: string;
  chapter_id: string;
  index: number;
  layout_type: string;
  content_json: Record<string, any>;
  narration_url?: string;
  created_at: string;
}

const samplePageData: PageData = {
  id: 'page-abc123',
  chapter_id: 'chapter-001',
  index: 1,
  layout_type: 'hero_with_text',
  content_json: {
    title: 'The Enchanted Forest',
    body: 'Deep in the heart of the ancient woods...',
    background_image: '/assets/forest-bg.png',
    character_sprite: '/assets/hero-sprite.png',
  },
  narration_url: 'https://storage.example.com/audio/page-001.mp3',
  created_at: '2025-11-27T03:45:00Z',
};

const requiredFields = ['id', 'chapter_id', 'content_json'];

export function TextContentPanel() {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; missing?: string[] } | null>(null);
  const isMobile = useIsMobile();

  const validateSchema = () => {
    if (!pageData) {
      setValidationResult({ valid: false, missing: ['No data to validate'] });
      logDevEvent('warn', 'Schema validation attempted with no data');
      return;
    }

    const missing: string[] = [];
    requiredFields.forEach((field) => {
      if (!(field in pageData)) {
        missing.push(field);
      }
    });

    const isValid = missing.length === 0;
    setValidationResult({ valid: isValid, missing: isValid ? undefined : missing });

    if (isValid) {
      logDevEvent('info', 'Schema validation passed', { pageId: pageData.id });
    } else {
      logDevEvent('error', `Schema validation failed: Missing fields - ${missing.join(', ')}`, {
        pageId: pageData?.id,
        missing,
      });
    }
  };

  const generateSample = () => {
    setPageData(samplePageData);
    setValidationResult(null);
    logDevEvent('info', 'Generated sample page data', { pageId: samplePageData.id });
  };

  const clearData = () => {
    setPageData(null);
    setValidationResult(null);
  };

  return (
    <div className="space-y-4 md:space-y-6 overflow-x-hidden">
      <div>
        <h3 className="text-lg md:text-2xl font-bold text-foreground">Text/Content Inspector</h3>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">Validate and inspect page content JSON</p>
      </div>

      {/* Actions - Stack on mobile */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-3">
        <Button
          onClick={generateSample}
          variant="default"
          size="sm"
          className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 h-10 md:h-9 touch-manipulation"
        >
          <FileJson className="h-4 w-4 mr-2" />
          Generate Sample
        </Button>
        <Button
          onClick={validateSchema}
          disabled={!pageData}
          variant="default"
          size="sm"
          className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 disabled:opacity-50 h-10 md:h-9 touch-manipulation"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Validate Schema
        </Button>
        {pageData && (
          <Button
            onClick={clearData}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-10 md:h-9 touch-manipulation"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Validation Result */}
      {validationResult && (
        <Card className={`border ${validationResult.valid ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <CardContent className="py-3 md:py-4">
            <div className="flex items-center gap-3">
              {validationResult.valid ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-green-400 font-medium text-sm md:text-base">Schema Valid</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-red-400 font-medium text-sm md:text-base">Schema Invalid</div>
                    <div className="text-xs md:text-sm text-red-300 mt-1 break-words">
                      Missing: {validationResult.missing?.join(', ')}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* JSON Inspector */}
      <Card className="bg-secondary/50 border-border">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-foreground text-sm md:text-base">JSON Inspector</CardTitle>
          <CardDescription className="text-muted-foreground text-xs md:text-sm">
            Current page state visualization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pageData ? (
            <div className="bg-background/50 rounded-lg p-3 md:p-4 overflow-x-auto max-w-full">
              <pre className="text-xs md:text-sm">
                <code>
                  {'{'}
                  {'\n'}
                  {Object.entries(pageData).map(([key, value], idx, arr) => (
                    <span key={key}>
                      {'  '}
                      <span className="text-purple-400">"{key}"</span>
                      {': '}
                      {typeof value === 'object' && value !== null ? (
                        <>
                          {'{'}
                          {'\n'}
                          {Object.entries(value).map(([k, v], i, a) => (
                            <span key={k}>
                              {'    '}
                              <span className="text-purple-400">"{k}"</span>
                              {': '}
                              <span className="text-green-400">
                                {typeof v === 'string' ? `"${isMobile && String(v).length > 20 ? String(v).slice(0, 20) + '...' : v}"` : String(v)}
                              </span>
                              {i < a.length - 1 ? ',' : ''}
                              {'\n'}
                            </span>
                          ))}
                          {'  }'}
                        </>
                      ) : (
                        <span className={typeof value === 'string' ? 'text-green-400' : 'text-blue-400'}>
                          {typeof value === 'string' ? `"${isMobile && String(value).length > 30 ? String(value).slice(0, 30) + '...' : value}"` : String(value)}
                        </span>
                      )}
                      {idx < arr.length - 1 ? ',' : ''}
                      {'\n'}
                    </span>
                  ))}
                  {'}'}
                </code>
              </pre>
            </div>
          ) : (
            <div className="py-8 md:py-12 text-center text-muted-foreground">
              <FileJson className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm md:text-base">No data loaded</p>
              <p className="text-xs md:text-sm mt-1">Click "Generate Sample" to create placeholder data</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schema Reference */}
      <Card className="bg-secondary/50 border-border">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-foreground text-sm md:text-base">Schema Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs md:text-sm">
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
              <Badge variant="outline" className="text-xs text-red-400 border-red-500/30 w-fit">Required</Badge>
              <span className="text-foreground/80">id, chapter_id, content_json</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
              <Badge variant="outline" className="text-xs text-muted-foreground border-border w-fit">Optional</Badge>
              <span className="text-foreground/80">index, layout_type, narration_url, created_at</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
