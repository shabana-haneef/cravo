import jwt from './apps/backend/src/shared/utils/jwt.utils.js';
import prisma from './apps/backend/src/lib/prisma.js';
import axios from 'axios';

async function test() {
  const user = await prisma.user.findFirst({ where: { role: 'SELLER' } });
  if (!user) return console.log('No seller found');
  const token = jwt.generateToken(user.id);
  
  try {
    const res = await axios.get('http://localhost:5000/api/v1/sellers/settings/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("NOTIFICATIONS:");
    console.log(res.data);
  } catch (e) {
    console.error("NOTIFICATIONS ERROR:");
    console.error(e.response?.data || e.message);
  }

  try {
    const res = await axios.get('http://localhost:5000/api/v1/sellers/settings/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("PROFILE:");
    console.log(res.data);
  } catch (e) {
    console.error("PROFILE ERROR:");
    console.error(e.response?.data || e.message);
  }
}
test();
