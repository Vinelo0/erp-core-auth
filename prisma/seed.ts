import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Criando permissões padrão
  const permissions = await Promise.all([
    // Users
    prisma.permission.upsert({ where: { name: "users:list" },   update: {}, create: { name: "users:list",   resource: "users", action: "list" } }),
    prisma.permission.upsert({ where: { name: "users:read" },   update: {}, create: { name: "users:read",   resource: "users", action: "read" } }),
    prisma.permission.upsert({ where: { name: "users:create" }, update: {}, create: { name: "users:create", resource: "users", action: "create" } }),
    prisma.permission.upsert({ where: { name: "users:update" }, update: {}, create: { name: "users:update", resource: "users", action: "update" } }),
    prisma.permission.upsert({ where: { name: "users:delete" }, update: {}, create: { name: "users:delete", resource: "users", action: "delete" } }),

    // Fiscal (Squad 2)
    prisma.permission.upsert({ where: { name: "invoice:create" }, update: {}, create: { name: "invoice:create", resource: "invoice", action: "create" } }),
    prisma.permission.upsert({ where: { name: "invoice:read" },   update: {}, create: { name: "invoice:read",   resource: "invoice", action: "read" } }),

    // CRM (Squad 3)
    prisma.permission.upsert({ where: { name: "crm:read" },   update: {}, create: { name: "crm:read",   resource: "crm", action: "read" } }),
    prisma.permission.upsert({ where: { name: "crm:create" }, update: {}, create: { name: "crm:create", resource: "crm", action: "create" } }),

    // Tickets (Squad 4)
    prisma.permission.upsert({ where: { name: "tickets:read" },   update: {}, create: { name: "tickets:read",   resource: "tickets", action: "read" } }),
    prisma.permission.upsert({ where: { name: "tickets:create" }, update: {}, create: { name: "tickets:create", resource: "tickets", action: "create" } }),
    prisma.permission.upsert({ where: { name: "tickets:delete" }, update: {}, create: { name: "tickets:delete", resource: "tickets", action: "delete" } }),

    // Roles
    prisma.permission.upsert({ where: { name: "roles:manage" }, update: {}, create: { name: "roles:manage", resource: "roles", action: "manage" } }),
  ]);

  console.log(`✅ ${permissions.length} permissões criadas`);

  // Criando roles padrão
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: { name: "admin", description: "Acesso total ao sistema" },
  });

  const viewerRole = await prisma.role.upsert({
    where: { name: "viewer" },
    update: {},
    create: { name: "viewer", description: "Somente leitura" },
  });

  const accountantRole = await prisma.role.upsert({
    where: { name: "accountant" },
    update: {},
    create: { name: "accountant", description: "Acesso ao módulo fiscal" },
  });

  const salesRole = await prisma.role.upsert({
    where: { name: "sales_rep" },
    update: {},
    create: { name: "sales_rep", description: "Acesso ao módulo CRM" },
  });

  console.log("✅ 4 roles criadas");

  // Vinculando TODAS as permissões ao admin
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log("✅ Admin recebeu todas as permissões");

  // Viewer só lê
  const viewerPerms = permissions.filter(p => p.action === "read" || p.action === "list");
  for (const permission of viewerPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: viewerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: viewerRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log("✅ Viewer recebeu permissões de leitura");

  // Accountant acessa fiscal
  const accountantPerms = permissions.filter(p => p.resource === "invoice");
  for (const permission of accountantPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: accountantRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: accountantRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log("✅ Accountant recebeu permissões fiscais");

  // Sales acessa CRM
  const salesPerms = permissions.filter(p => p.resource === "crm");
  for (const permission of salesPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: salesRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: salesRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log("✅ Sales Rep recebeu permissões de CRM");
  console.log("\n🎉 Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });