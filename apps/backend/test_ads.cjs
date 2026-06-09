require('dotenv').config();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function main() {
  const seller = await prisma.seller.findFirst({ include: { user: true } });
  if (!seller) return console.log('No seller found');
  
  const token = jwt.sign({ id: seller.user.id }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1d' });
  
  try {
    const res = await axios.get('http://localhost:5000/api/v1/sellers/ads/packages', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Packages response:', res.data);
  } catch (err) {
    console.error('Error fetching packages:', err.response?.data || err.message);
  }

  try {
    const res = await axios.get('http://localhost:5000/api/v1/sellers/ads', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Ads response:', res.data);
  } catch (err) {
    console.error('Error fetching ads:', err.response?.data || err.message);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
