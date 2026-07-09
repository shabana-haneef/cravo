import { PrismaClient } from '@prisma/client';
import { redis } from '../../../config/redis.js';
import { logger } from '../../../shared/services/logger.js';

const prisma = new PrismaClient();

const BASE_URL = 'https://cravo.com';
const MAX_URLS_PER_SITEMAP = 10000;

export class SitemapService {
  /**
   * Main cron job entry point. Generates and caches all sitemaps in Redis.
   */
  static async buildAllAndCache() {
    try {
      logger.info('Sitemap generation started');
      
      // 1. Static Sitemap
      const staticXml = this._generateStaticXml();
      await redis.setEx('sitemap:static', 86400 * 2, staticXml);
      
      // 2. Categories Sitemap
      const categories = await prisma.category.findMany({
        where: { isActive: true, deletedAt: null },
        select: { slug: true, updatedAt: true }
      });
      const categoriesXml = this._generateCategoriesXml(categories);
      await redis.setEx('sitemap:categories', 86400 * 2, categoriesXml);

      // 3. Shops / Brands Sitemap
      const shops = await prisma.shop.findMany({
        where: { status: 'ACTIVE', deletedAt: null },
        select: { slug: true, updatedAt: true }
      });
      const shopsXml = this._generateShopsXml(shops);
      await redis.setEx('sitemap:shops', 86400 * 2, shopsXml);

      // 4. Products Sitemaps (Paginated)
      const productCount = await prisma.product.count({
        where: { status: 'APPROVED', deletedAt: null }
      });
      const pages = Math.ceil(productCount / MAX_URLS_PER_SITEMAP);
      
      for (let i = 0; i < pages; i++) {
        const products = await prisma.product.findMany({
          where: { status: 'APPROVED', deletedAt: null },
          select: { slug: true, updatedAt: true },
          skip: i * MAX_URLS_PER_SITEMAP,
          take: MAX_URLS_PER_SITEMAP
        });
        const productXml = this._generateProductsXml(products);
        await redis.setEx(`sitemap:products:${i + 1}`, 86400 * 2, productXml);
      }

      // 5. Sitemap Index
      const indexXml = this._generateSitemapIndex(pages);
      await redis.setEx('sitemap:index', 86400 * 2, indexXml);

      // 6. Meta keys for pagination count
      await redis.setEx('sitemap:product_pages', 86400 * 2, pages.toString());

      logger.info('Sitemap generation completed and cached to Redis successfully.');
    } catch (error) {
      logger.error({ error }, 'Failed to generate sitemap');
      throw error;
    }
  }

  // Retrievers that hit cache first
  static async getIndex() {
    let xml = await redis.get('sitemap:index');
    if (!xml) {
      await this.buildAllAndCache();
      xml = await redis.get('sitemap:index');
    }
    return xml;
  }

  static async getStatic() {
    return await redis.get('sitemap:static');
  }

  static async getCategories() {
    return await redis.get('sitemap:categories');
  }

  static async getShops() {
    return await redis.get('sitemap:shops');
  }

  static async getProductsPage(page) {
    return await redis.get(`sitemap:products:${page}`);
  }

  // XML Generators
  static _generateSitemapIndex(productPages) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    xml += `  <sitemap>\n`;
    xml += `    <loc>${BASE_URL}/api/seo/sitemap-static.xml</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += `  </sitemap>\n`;
    
    xml += `  <sitemap>\n`;
    xml += `    <loc>${BASE_URL}/api/seo/sitemap-categories.xml</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += `  </sitemap>\n`;

    xml += `  <sitemap>\n`;
    xml += `    <loc>${BASE_URL}/api/seo/sitemap-shops.xml</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += `  </sitemap>\n`;

    for (let i = 1; i <= productPages; i++) {
      xml += `  <sitemap>\n`;
      xml += `    <loc>${BASE_URL}/api/seo/sitemap-products-${i}.xml</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      xml += `  </sitemap>\n`;
    }

    xml += `</sitemapindex>`;
    return xml;
  }

  static _generateStaticXml() {
    const pages = [
      '',
      '/products',
      '/categories',
      '/brands',
      '/shops',
      '/about',
      '/contact',
      '/help',
      '/faq',
      '/privacy',
      '/terms'
    ];
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    for (const page of pages) {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}${page}</loc>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    }
    xml += `</urlset>`;
    return xml;
  }

  static _generateCategoriesXml(categories) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    for (const cat of categories) {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}/products?category=${cat.slug}</loc>\n`;
      xml += `    <lastmod>${cat.updatedAt.toISOString()}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }
    xml += `</urlset>`;
    return xml;
  }

  static _generateShopsXml(shops) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    for (const shop of shops) {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}/shops/${shop.slug}</loc>\n`;
      xml += `    <lastmod>${shop.updatedAt.toISOString()}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }
    xml += `</urlset>`;
    return xml;
  }

  static _generateProductsXml(products) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    for (const product of products) {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}/products/${product.slug}</loc>\n`;
      xml += `    <lastmod>${product.updatedAt.toISOString()}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    }
    xml += `</urlset>`;
    return xml;
  }
}
