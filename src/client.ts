/**
 * KEGG HTTP client with retries, timeouts, keep-alive, polite rate limiting,
 * and configurable base URL.
 */

import { KEGGClientConfig } from './types.js';
import { sleep, urlEncodeSegment } from './utils.js';

export class KEGGClient {
  private config: KEGGClientConfig;
  private lastRequestTime = 0;
  private minIntervalMs: number;

  constructor(config?: Partial<KEGGClientConfig>) {
    this.config = {
      baseURL: config?.baseURL ?? 'https://rest.kegg.jp',
      timeout: config?.timeout ?? 30000,
      retries: config?.retries ?? 3,
      retryDelay: config?.retryDelay ?? 1000,
      userAgent: config?.userAgent ?? 'kegg-mcp/1.0.0',
    };
    // Polite rate limit: 3 requests per second max
    this.minIntervalMs = 334;
  }

  private async politeDelay(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minIntervalMs) {
      await sleep(this.minIntervalMs - elapsed);
    }
    this.lastRequestTime = Date.now();
  }

  async get(path: string): Promise<{ data: string; status: number }> {
    await this.politeDelay();

    const url = new URL(path, this.config.baseURL);

    let lastError: Error | null = null;
    let lastStatus: number | null = null;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'User-Agent': this.config.userAgent,
            'Accept': 'text/plain',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.text();
        lastStatus = response.status;

        if (!response.ok) {
          if (response.status === 400) {
            throw new Error(`KEGG API 400 Bad Request: ${path}`);
          }
          if (response.status === 404) {
            throw new Error(`KEGG API 404 Not Found: ${path}`);
          }
          if (response.status >= 500) {
            throw new Error(`KEGG API ${response.status} Server Error: ${path}`);
          }
          throw new Error(`KEGG API ${response.status}: ${path}`);
        }

        return { data, status: response.status };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new Error(`KEGG API timeout after ${this.config.timeout}ms: ${path}`, { cause: error });
          break;
        }

        // Don't retry on 4xx client errors.
        if (lastStatus !== null && lastStatus >= 400 && lastStatus < 500) {
          break;
        }

        if (attempt < this.config.retries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await sleep(delay);
        }
      }
    }

    throw lastError ?? new Error(`KEGG API request failed: ${path}`);
  }

  async info(database: string): Promise<string> {
    return (await this.get(`/info/${urlEncodeSegment(database)}`)).data;
  }

  async list(database: string): Promise<string> {
    return (await this.get(`/list/${urlEncodeSegment(database)}`)).data;
  }

  async find(database: string, query: string, option?: string): Promise<string> {
    let path = `/find/${urlEncodeSegment(database)}/${urlEncodeSegment(query)}`;
    if (option) {
      path += `/${urlEncodeSegment(option)}`;
    }
    return (await this.get(path)).data;
  }

  async getEntry(entryId: string, option?: string): Promise<string> {
    let path = `/get/${urlEncodeSegment(entryId)}`;
    if (option) {
      path += `/${urlEncodeSegment(option)}`;
    }
    return (await this.get(path)).data;
  }

  async getEntries(entryIds: string[]): Promise<string> {
    const joined = entryIds.map(urlEncodeSegment).join('+');
    return (await this.get(`/get/${joined}`)).data;
  }

  async conv(targetDb: string, source: string): Promise<string> {
    return (await this.get(`/conv/${urlEncodeSegment(targetDb)}/${urlEncodeSegment(source)}`)).data;
  }

  async link(targetDb: string, source: string): Promise<string> {
    return (await this.get(`/link/${urlEncodeSegment(targetDb)}/${urlEncodeSegment(source)}`)).data;
  }

  async ddi(drugIds: string[]): Promise<string> {
    const joined = drugIds.map(urlEncodeSegment).join('+');
    return (await this.get(`/ddi/${joined}`)).data;
  }
}
