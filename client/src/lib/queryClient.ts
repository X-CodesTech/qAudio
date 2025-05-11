import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options: { directAccess?: boolean } = {}
): Promise<Response> {
  // Add direct access to URL for GET requests
  let requestUrl = url;
  if (method === 'GET' && options.directAccess) {
    requestUrl = url.includes('?') 
      ? `${url}&directAccess=true` 
      : `${url}?directAccess=true`;
  }
  
  const headers: Record<string, string> = {};
  
  // Add Content-Type header for requests with body
  if (data) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Add direct access header for non-GET requests
  if (options.directAccess) {
    headers['X-Direct-Access'] = 'true';
  }
  
  const res = await fetch(requestUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  directAccess?: boolean;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, directAccess = true }) =>
  async ({ queryKey }) => {
    // Add directAccess parameter to the URL
    const url = queryKey[0] as string;
    const requestUrl = directAccess 
      ? (url.includes('?') ? `${url}&directAccess=true` : `${url}?directAccess=true`)
      : url;
    
    const headers: Record<string, string> = {};
    
    // Add direct access header
    if (directAccess) {
      headers['X-Direct-Access'] = 'true';
    }
    
    const res = await fetch(requestUrl, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw", directAccess: true }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
