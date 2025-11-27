import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, FileJson } from 'lucide-react';
import { logDevEvent } from '../stores/devLogsStore';

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
    body: 'Deep in the heart of the ancient woods, where sunlight barely touched the forest floor...',
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
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-100">Text/Content Inspector</h3>
        <p className="text-slate-400 mt-2">Validate and inspect page content JSON</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={generateSample}
          variant="default"
          size="sm"
          className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
        >
          <FileJson className="h-4 w-4 mr-2" />
          Generate Sample
        </Button>
        <Button
          onClick={validateSchema}
          disabled={!pageData}
          variant="default"
          size="sm"
          className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 disabled:opacity-50"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Validate Schema
        </Button>
        {pageData && (
          <Button
            onClick={clearData}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-200"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Validation Result */}
      {validationResult && (
        <Card className={`border ${validationResult.valid ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              {validationResult.valid ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-400 font-medium">Schema Valid</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="text-red-400 font-medium">Schema Invalid</div>
                    <div className="text-sm text-red-300 mt-1">
                      Missing fields: {validationResult.missing?.join(', ')}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* JSON Inspector */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">JSON Inspector</CardTitle>
          <CardDescription className="text-slate-400">
            Current page state visualization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pageData ? (
            <div className="bg-slate-900/50 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm">
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
                                {typeof v === 'string' ? `"${v}"` : String(v)}
                              </span>
                              {i < a.length - 1 ? ',' : ''}
                              {'\n'}
                            </span>
                          ))}
                          {'  }'}
                        </>
                      ) : (
                        <span className={typeof value === 'string' ? 'text-green-400' : 'text-blue-400'}>
                          {typeof value === 'string' ? `"${value}"` : String(value)}
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
            <div className="py-12 text-center text-slate-400">
              <FileJson className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No data loaded</p>
              <p className="text-sm mt-1">Click "Generate Sample" to create placeholder data</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schema Reference */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100 text-base">Schema Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs text-red-400 border-red-500/30">Required</Badge>
              <span className="text-slate-300">id, chapter_id, content_json</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">Optional</Badge>
              <span className="text-slate-300">index, layout_type, narration_url, created_at</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
