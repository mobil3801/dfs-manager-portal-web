import { createUser } from "./server/auth.ts";

async function main() {
  try {
    console.log("Creating admin account...");
    
    const admin = await createUser({
      email: "admin@dfs-portal.com",
      password: "12345678",
      name: "Admin",
      role: "admin",
    });

    console.log("✅ Admin account created successfully!");
    console.log("Email:", admin.email);
    console.log("Role:", admin.role);
    console.log("\nYou can now login with:");
    console.log("Email: admin@dfs-portal.com");
    console.log("Password: 12345678");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to create admin account:");
    console.error(error.message);
    process.exit(1);
  }
}

main();

