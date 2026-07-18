import { Helmet } from 'react-helmet-async';
import { useLocation } from 'wouter';
import { getSEOConfig } from '@/lib/seo-config';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
}

export function SEO({ title, description, keywords, ogImage, canonical }: SEOProps = {}) {
  const [location] = useLocation();
  
  const cleanPath = location.split('?')[0].split('#')[0];
  
  const defaultConfig = getSEOConfig(cleanPath);

  const seoTitle = title || defaultConfig.title;
  const seoDescription = description || defaultConfig.description;
  const seoKeywords = keywords || defaultConfig.keywords;
  const seoOgImage = ogImage || defaultConfig.ogImage;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const seoCanonical = canonical || `${baseUrl}${cleanPath}`;

  const fullOgImageUrl = seoOgImage?.startsWith('http') 
    ? seoOgImage 
    : `${typeof window !== 'undefined' ? window.location.origin : ''}${seoOgImage}`;

  return (
    <Helmet>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      
      {seoCanonical && <link rel="canonical" href={seoCanonical} />}
      
      <meta property="og:type" content="website" />
      <meta property="og:url" content={seoCanonical} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      {seoOgImage && <meta property="og:image" content={fullOgImageUrl} />}
      
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={seoCanonical} />
      <meta property="twitter:title" content={seoTitle} />
      <meta property="twitter:description" content={seoDescription} />
      {seoOgImage && <meta property="twitter:image" content={fullOgImageUrl} />}
    </Helmet>
  );
}
