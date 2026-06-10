import prisma from '../../../lib/prisma.js';

export const categoryRepository = {
  async create(data, tx = prisma) {
    return tx.category.create({ data });
  },
  async findAll(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    return prisma.category.findMany({ where, orderBy: { name: 'asc' } });
  },
  async findById(id) {
    return prisma.category.findUnique({ where: { id } });
  },
  async findBySlug(slug) {
    return prisma.category.findUnique({ where: { slug } });
  },
  async update(id, data) {
    return prisma.category.update({ where: { id }, data });
  },
  async delete(id) {
    return prisma.category.delete({ where: { id } });
  }
};
