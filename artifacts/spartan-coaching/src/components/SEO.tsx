import { Helmet } from 'react-helmet-async';
import { useLocation } from 'wouter';
import { getSEOConfig, SITE_NAME, DEFAULT_OG_IMAGE, isNoIndexPath } from '@/lib/seo-config';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
  /** Force noindex even on public paths */
  noIndex?: boolean;
}

function absoluteUrl(pathOrUrl: string | undefined, origin: string): string | undefined {
  if (!pathOrUrl) return undefined;
  if (pathOrUrl.startsWith('http')) return pathOrUrl;
  return `${origin}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

export function SEO({ title, description, keywords, ogImage, canonical, noIndex }: SEOProps = {}) {
  const [location] = useLocation();

  const cleanPath = location.split('?')[0].split('#')[0] || '/';
  const defaultConfig = getSEOConfig(cleanPath);

  const seoTitle = title || defaultConfig.title;
  const seoDescription = description || defaultConfig.description;
  const seoKeywords = keywords || defaultConfig.keywords;
  const seoOgImage = ogImage || defaultConfig.ogImage || DEFAULT_OG_IMAGE;

  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://spartancoaching.com';

  const seoCanonical = canonical || `${origin}${cleanPath === '/' ? '' : cleanPath}`;
  const fullOgImageUrl = absoluteUrl(seoOgImage, origin) || `${origin}${DEFAULT_OG_IMAGE}`;
  const shouldNoIndex = noIndex === true || defaultConfig.noIndex === true || isNoIndexPath(cleanPath);

  return (
    <Helmet>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      {seoKeywords && <meta name="keywords" content={seoKeywords} />}
      {shouldNoIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {seoCanonical && <link rel="canonical" href={seoCanonical} />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:url" content={seoCanonical} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={fullOgImageUrl} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={seoCanonical} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={fullOgImageUrl} />
    </Helmet>
  );
}
