// Cloudflare Worker to handle CORS for R2 bucket
// Deploy this as a Worker in front of your R2 bucket

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    };

    // Handle OPTIONS preflight request
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Handle actual requests
    const url = new URL(request.url);

    // Proxy PUT requests to R2
    if (request.method === 'PUT') {
      const r2Url = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com${url.pathname}${url.search}`;

      const modifiedRequest = new Request(r2Url, request);

      // Add CORS headers to R2 response
      const response = await fetch(modifiedRequest);

      const newResponse = new Response(response.body, response);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newResponse.headers.set(key, value);
      });

      return newResponse;
    }

    // For other methods, pass through to R2
    const r2Url = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com${url.pathname}${url.search}`;
    return await fetch(new Request(r2Url, request));
  }
};