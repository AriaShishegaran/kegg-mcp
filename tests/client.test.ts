import { describe, it, expect, vi } from 'vitest';
import { KEGGClient } from '../src/client.js';

describe('KEGGClient', () => {
  it('constructs with default config', () => {
    const client = new KEGGClient();
    expect(client).toBeDefined();
  });

  it('constructs with custom config', () => {
    const client = new KEGGClient({ baseURL: 'https://example.com', timeout: 5000, retries: 1 });
    expect(client).toBeDefined();
  });

  it('info builds correct path', async () => {
    const client = new KEGGClient();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'KEGG release info',
    });
    global.fetch = mockFetch as any;

    await client.info('kegg');
    expect(mockFetch).toHaveBeenCalled();
    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe('/info/kegg');
  });

  it('list builds correct path', async () => {
    const client = new KEGGClient();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'list data',
    });
    global.fetch = mockFetch as any;

    await client.list('genome');
    expect(mockFetch).toHaveBeenCalled();
    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe('/list/genome');
  });

  it('find builds correct path with query', async () => {
    const client = new KEGGClient();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'find data',
    });
    global.fetch = mockFetch as any;

    await client.find('pathway', 'glycolysis');
    expect(mockFetch).toHaveBeenCalled();
    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe('/find/pathway/glycolysis');
  });

  it('find builds correct path with option', async () => {
    const client = new KEGGClient();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'find data',
    });
    global.fetch = mockFetch as any;

    await client.find('compound', '300-310', 'mol_weight');
    expect(mockFetch).toHaveBeenCalled();
    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe('/find/compound/300-310/mol_weight');
  });

  it('getEntry builds correct path', async () => {
    const client = new KEGGClient();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'entry data',
    });
    global.fetch = mockFetch as any;

    await client.getEntry('hsa00010');
    expect(mockFetch).toHaveBeenCalled();
    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe('/get/hsa00010');
  });

  it('getEntry with option builds correct path', async () => {
    const client = new KEGGClient();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'kgml data',
    });
    global.fetch = mockFetch as any;

    await client.getEntry('hsa00010', 'kgml');
    expect(mockFetch).toHaveBeenCalled();
    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe('/get/hsa00010/kgml');
  });

  it('getEntries joins ids with +', async () => {
    const client = new KEGGClient();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'batch data',
    });
    global.fetch = mockFetch as any;

    await client.getEntries(['hsa:10458', 'ece:Z5100']);
    expect(mockFetch).toHaveBeenCalled();
    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe('/get/hsa%3A10458+ece%3AZ5100');
  });

  it('conv builds correct path', async () => {
    const client = new KEGGClient();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'conv data',
    });
    global.fetch = mockFetch as any;

    await client.conv('ncbi-geneid', 'hsa:10458');
    expect(mockFetch).toHaveBeenCalled();
    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe('/conv/ncbi-geneid/hsa%3A10458');
  });

  it('link builds correct path', async () => {
    const client = new KEGGClient();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'link data',
    });
    global.fetch = mockFetch as any;

    await client.link('hsa', 'hsa00010');
    expect(mockFetch).toHaveBeenCalled();
    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe('/link/hsa/hsa00010');
  });

  it('ddi builds correct path', async () => {
    const client = new KEGGClient();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'ddi data',
    });
    global.fetch = mockFetch as any;

    await client.ddi(['D00564', 'D00565']);
    expect(mockFetch).toHaveBeenCalled();
    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe('/ddi/D00564+D00565');
  });

  it('throws on 400 Bad Request', async () => {
    const client = new KEGGClient();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => '',
    });
    global.fetch = mockFetch as any;

    await expect(client.get('/list/organism')).rejects.toThrow('400 Bad Request');
  });

  it('throws on 404 Not Found', async () => {
    const client = new KEGGClient();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => '',
    });
    global.fetch = mockFetch as any;

    await expect(client.get('/get/INVALID')).rejects.toThrow('404 Not Found');
  });

  it('retries on 500 Server Error', async () => {
    const client = new KEGGClient({ retries: 2, retryDelay: 10 });
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => '' })
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => 'ok' });
    global.fetch = mockFetch as any;

    const result = await client.get('/info/kegg');
    expect(result.data).toBe('ok');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry on 400', async () => {
    const client = new KEGGClient({ retries: 3, retryDelay: 10 });
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => '',
    });
    global.fetch = mockFetch as any;

    await expect(client.get('/list/organism')).rejects.toThrow('400 Bad Request');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
