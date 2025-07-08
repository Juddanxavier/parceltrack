/** @format */

declare module '@/generated/prisma' {
  import { PrismaClient as PC } from '@prisma/client';
  export const PrismaClient: typeof PC;
  export type PrismaClient = PC;
}
