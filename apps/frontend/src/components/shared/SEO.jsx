import React from 'react';
import { Helmet } from 'react-helmet-async';

export const SEO = ({ 
  title, 
  description, 
  keywords, 
  image, 
  url, 
  type = 'website',
  schema 
}) => {
  const siteTitle = 'Cravo Marketplace';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const defaultDescription = 'Shop for fresh produce, groceries, electronics, and more at Cravo Marketplace. Secure payments and fast delivery.';
  const finalDescription = description || defaultDescription;
  
  // Compute Canonical URL
  const computeCanonical = () => {
    try {
      const currentUrl = new URL(url || window.location.href);
      
      // We want to STRIP sort, page, minPrice, maxPrice, and search to prevent duplicate content.
      // But we PRESERVE category since /products?category=x represents a unique topic cluster.
      const category = currentUrl.searchParams.get('category');
      
      // Clear all existing parameters to ensure a pristine state
      currentUrl.search = '';
      
      // Re-inject strictly allowed parameters
      if (category) {
        currentUrl.searchParams.set('category', category);
      }
      
      return currentUrl.toString();
    } catch (e) {
      // Fallback if URL parsing fails
      return url || window.location.href;
    }
  };

  const canonicalUrl = computeCanonical();

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* OpenGraph / Facebook / WhatsApp */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}
      <meta property="og:type" content={type} />
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      {image && <meta name="twitter:image" content={image} />}

      {/* JSON-LD Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};
