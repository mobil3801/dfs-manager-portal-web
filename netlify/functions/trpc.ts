import type { Handler } from '@netlify/functions';
import { appRouter } from '../../server/routers';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { sdk } from '../../server/_core/sdk';
import type { User } from '../../drizzle/schema';

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    };
  }

  try {
    const request = new Request(
      `https://${event.headers.host}${event.path}`,
      {
        method: event.httpMethod,
        headers: new Headers(event.headers as Record<string, string>),
        body: event.body || undefined,
      }
    );

    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: request,
      router: appRouter,
      createContext: async () => {
        let user: User | null = null;
        
        try {
          // Parse cookies from header
          const cookies = parseCookies(event.headers.cookie || '');
          const mockReq = {
            headers: event.headers,
            cookies,
          };
          user = await sdk.authenticateRequest(mockReq as any);
        } catch (error) {
          user = null;
        }

        const mockReq = {
          headers: event.headers,
          cookies: parseCookies(event.headers.cookie || ''),
        };
        const mockRes = {
          cookie: () => {},
          clearCookie: () => {},
        };
        
        return {
          req: mockReq as any,
          res: mockRes as any,
          user,
        };
      },
    });

    const responseBody = await response.text();
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      statusCode: response.status,
      headers: {
        ...responseHeaders,
        'Access-Control-Allow-Origin': '*',
      },
      body: responseBody,
    };
  } catch (error) {
    console.error('tRPC handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    if (name && rest.length > 0) {
      cookies[name.trim()] = rest.join('=').trim();
    }
  });
  
  return cookies;
}

