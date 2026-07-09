import { SitemapService } from '../services/sitemap.service.js';
import { logger } from '../../../shared/services/logger.js';

export const getSitemapIndex = async (req, res) => {
  try {
    const xml = await SitemapService.getIndex();
    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    logger.error({ error }, 'Error serving sitemap index');
    res.status(500).send('Error generating sitemap');
  }
};

export const getStaticSitemap = async (req, res) => {
  try {
    let xml = await SitemapService.getStatic();
    if (!xml) {
      await SitemapService.buildAllAndCache();
      xml = await SitemapService.getStatic();
    }
    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    logger.error({ error }, 'Error serving static sitemap');
    res.status(500).send('Error generating sitemap');
  }
};

export const getCategoriesSitemap = async (req, res) => {
  try {
    let xml = await SitemapService.getCategories();
    if (!xml) {
      await SitemapService.buildAllAndCache();
      xml = await SitemapService.getCategories();
    }
    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    logger.error({ error }, 'Error serving categories sitemap');
    res.status(500).send('Error generating sitemap');
  }
};

export const getShopsSitemap = async (req, res) => {
  try {
    let xml = await SitemapService.getShops();
    if (!xml) {
      await SitemapService.buildAllAndCache();
      xml = await SitemapService.getShops();
    }
    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    logger.error({ error }, 'Error serving shops sitemap');
    res.status(500).send('Error generating sitemap');
  }
};

export const getProductsSitemap = async (req, res) => {
  try {
    const page = req.params.page || 1;
    let xml = await SitemapService.getProductsPage(page);
    if (!xml) {
      await SitemapService.buildAllAndCache();
      xml = await SitemapService.getProductsPage(page);
    }
    
    if (!xml) {
      return res.status(404).send('Sitemap page not found');
    }

    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    logger.error({ error }, 'Error serving products sitemap');
    res.status(500).send('Error generating sitemap');
  }
};
