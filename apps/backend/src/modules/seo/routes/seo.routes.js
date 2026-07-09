import express from 'express';
import {
  getSitemapIndex,
  getStaticSitemap,
  getCategoriesSitemap,
  getShopsSitemap,
  getProductsSitemap
} from '../controllers/sitemap.controller.js';

const router = express.Router();

router.get('/sitemap.xml', getSitemapIndex);
router.get('/sitemap-static.xml', getStaticSitemap);
router.get('/sitemap-categories.xml', getCategoriesSitemap);
router.get('/sitemap-shops.xml', getShopsSitemap);
router.get('/sitemap-products-:page.xml', getProductsSitemap);

export default router;
