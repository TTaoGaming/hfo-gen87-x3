/**
 * Web Sensor - Tavily API Integration
 * Part of Lidless Legion Sensor Mesh
 */

import type { SenseResult, SensorAdapter } from '../contracts.js';
import { DEFAULT_CONFIG } from '../contracts.js';

export class WebSensor implements SensorAdapter {
  name = 'web' as const;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || DEFAULT_CONFIG.TAVILY_API_KEY;
  }

  async sense(query: string, limit: number, options?: Record<string, unknown>): Promise<SenseResult[]> {
    if (!this.apiKey) {
      console.warn('[WebSensor] No TAVILY_API_KEY configured, skipping web search');
      return [];
    }

    const depth = (options?.webDepth as string) || 'basic';

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          query,
          search_depth: depth,
          max_results: limit,
          include_raw_content: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status}`);
      }

      const data = await response.json() as {
        results: Array<{
          title: string;
          content: string;
          url: string;
          score: number;
        }>;
      };

      return data.results.map((r) => ({
        source: 'web' as const,
        title: r.title,
        content: r.content,
        url: r.url,
        score: r.score,
      }));
    } catch (error) {
      console.error('[WebSensor] Error:', error);
      return [];
    }
  }
}
