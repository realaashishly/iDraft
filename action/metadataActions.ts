'use server';

import * as cheerio from 'cheerio';

export interface FetchedMetadata {
  title: string;
  description: string;
  imageUrl: string;
}

type MetadataResult = {
  success: true;
  data: FetchedMetadata;
} | {
  success: false;
  error: string;
};

export async function fetchMetadataAction(url: string): Promise<MetadataResult> {
  if (!url || !url.startsWith('http')) {
    return { success: false, error: 'Invalid URL. Must start with http/https.' };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      signal: AbortSignal.timeout(10000), // 5-second timeout
    });

    if (!response.ok) {
      return { success: false, error: `Failed to access URL (Status: ${response.status})` };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const getMeta = (property: string, name: string) =>
      $(`meta[property='${property}']`).attr('content') ||
      $(`meta[name='${name}']`).attr('content');

    const title = getMeta('og:title', 'title') || $('title').text() || 'No Title Found';
    const description = getMeta('og:description', 'description') || 'No description available.';
    const imageUrl = getMeta('og:image', 'image') || '';

    let absoluteImageUrl = imageUrl;
    if (absoluteImageUrl && !absoluteImageUrl.startsWith('http')) {
      try {
        absoluteImageUrl = new URL(absoluteImageUrl, url).href;
      } catch (e) { /* ignore relative URL error */ }
    }

    return {
      success: true,
      data: {
        title: title.trim(),
        description: description.trim(),
        imageUrl: absoluteImageUrl.trim(),
      },
    };

  } catch (e) {
    console.error(e);
    return { success: false, error: 'An unknown error occurred during fetch.' };
  }
}