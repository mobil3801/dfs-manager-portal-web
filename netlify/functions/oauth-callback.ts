import { Handler } from '@netlify/functions';
import { handleOAuthCallback } from '../../server/_core/oauth';

export const handler: Handler = async (event, context) => {
  try {
    const code = event.queryStringParameters?.code;
    const state = event.queryStringParameters?.state;

    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing authorization code' }),
      };
    }

    // Create mock Express-like request/response
    const mockReq = {
      query: event.queryStringParameters,
      headers: event.headers,
    };

    let redirectUrl = '/';
    let sessionCookie = '';

    const mockRes = {
      redirect: (url: string) => {
        redirectUrl = url;
      },
      cookie: (name: string, value: string, options: any) => {
        sessionCookie = `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${options.maxAge || 31536000}`;
      },
    };

    await handleOAuthCallback(mockReq as any, mockRes as any);

    return {
      statusCode: 302,
      headers: {
        Location: redirectUrl,
        'Set-Cookie': sessionCookie,
      },
      body: '',
    };
  } catch (error) {
    console.error('OAuth callback error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'OAuth callback failed' }),
    };
  }
};

