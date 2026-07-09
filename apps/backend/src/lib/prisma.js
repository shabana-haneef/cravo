import { PrismaClient } from '@prisma/client';

// Shared Prisma instance to prevent multiple connection pools
const basePrisma = new PrismaClient();

const softDeleteModels = ['User', 'Seller', 'Shop', 'Category', 'Product', 'ProductVariant', 'Campaign'];

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async findMany({ model, operation, args, query }) {
        if (softDeleteModels.includes(model)) {
          args.where = { ...args.where, deletedAt: null };
        }
        return query(args);
      },
      async findFirst({ model, operation, args, query }) {
        if (softDeleteModels.includes(model)) {
          args.where = { ...args.where, deletedAt: null };
        }
        return query(args);
      },
      async findUnique({ model, operation, args, query }) {
        if (softDeleteModels.includes(model)) {
          // findUnique requires unique fields, cannot append deletedAt. 
          // We must fetch and return null if deleted.
          const result = await query(args);
          if (result && result.deletedAt) return null;
          return result;
        }
        return query(args);
      },
      async delete({ model, operation, args, query }) {
        if (softDeleteModels.includes(model)) {
          return basePrisma[model].update({
            where: args.where,
            data: { deletedAt: new Date() },
          });
        }
        return query(args);
      },
      async deleteMany({ model, operation, args, query }) {
        if (softDeleteModels.includes(model)) {
          return basePrisma[model].updateMany({
            where: args.where,
            data: { deletedAt: new Date() },
          });
        }
        return query(args);
      }
    }
  }
});

export default prisma;
