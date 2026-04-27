/** @type {import('next').NextConfig} */
const nextConfig = {
  // Capacitor로 패키징할 때 정적 export가 필요하면 아래 주석을 풀고
  // 동적 라우트 / API 라우트 / SSR 사용을 줄여 호환성을 유지하세요.
  // output: 'export',
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // 정적 export 시 next/image 최적화는 빌드 환경 외부에서 동작하지 않으므로
    // 자체 호스팅 이미지나 외부 CDN을 사용할 때 설정을 맞춰주세요.
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
