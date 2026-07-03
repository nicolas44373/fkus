const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHost = '';
if (supabaseUrl) {
  try {
    supabaseHost = new URL(supabaseUrl).hostname;
  } catch (e) {
    // Ignore invalid URLs
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'calisa.com.ar' },
      { protocol: 'https', hostname: 'arcordiezb2c.vteximg.com.br' },
      { protocol: 'https', hostname: 'congeladosartico.com.ar' },
      ...(supabaseHost ? [{ protocol: 'https', hostname: supabaseHost }] : [])
    ],
  },
  typescript: {
    ignoreBuildErrors: true,     // <--- ignora errores de TypeScript en build
  },
};

module.exports = nextConfig;