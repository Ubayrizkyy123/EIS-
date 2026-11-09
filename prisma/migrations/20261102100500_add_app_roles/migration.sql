-- Add active application roles without removing legacy profile roles.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'KEPALA_SEKOLAH';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'OPERATOR';
