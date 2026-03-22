// Script to create an admin account
import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'codegenius',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123'
});

async function createAdmin() {
    // ====================================
    // ADMIN ACCOUNT DETAILS - CHANGE THESE
    // ====================================
    const adminEmail = 'admin@codegenius.com';
    const adminPassword = 'Admin@123';  // Change this to your desired password
    const adminName = 'Admin User';
    // ====================================

    try {
        console.log('🔍 Checking for existing admin users...');

        // Check existing admins
        const existingAdmins = await pool.query(
            "SELECT id, email, full_name FROM users WHERE role = 'Admin'"
        );

        if (existingAdmins.rows.length > 0) {
            console.log('\n📋 Existing Admin Accounts:');
            existingAdmins.rows.forEach(admin => {
                console.log(`   ID: ${admin.id} | Email: ${admin.email} | Name: ${admin.full_name}`);
            });
        } else {
            console.log('   No existing admin accounts found.');
        }

        // Check if this email already exists
        const existingUser = await pool.query(
            "SELECT id, role FROM users WHERE email = $1",
            [adminEmail]
        );

        if (existingUser.rows.length > 0) {
            if (existingUser.rows[0].role === 'Admin') {
                console.log(`\n⚠️  User ${adminEmail} already exists as Admin (ID: ${existingUser.rows[0].id})`);
                console.log('   Resetting password...');

                // Reset password (column is password_hash in schema)
                const hashedPassword = await bcrypt.hash(adminPassword, 10);
                await pool.query(
                    "UPDATE users SET password_hash = $1 WHERE email = $2",
                    [hashedPassword, adminEmail]
                );

                console.log('\n✅ Password reset successfully!');
            } else {
                console.log(`\n🔄 User ${adminEmail} exists but is not Admin. Upgrading to Admin...`);

                const hashedPassword = await bcrypt.hash(adminPassword, 10);
                await pool.query(
                    "UPDATE users SET password_hash = $1, role = 'Admin' WHERE email = $2",
                    [hashedPassword, adminEmail]
                );

                console.log('\n✅ User upgraded to Admin and password reset!');
            }
        } else {
            console.log(`\n🆕 Creating new admin account: ${adminEmail}`);

            // Hash password
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            // Create admin user (column is password_hash in schema)
            const result = await pool.query(
                `INSERT INTO users (email, password_hash, full_name, role, current_level, total_points, problems_solved) 
                 VALUES ($1, $2, $3, 'Admin', 'Bronze', 0, 0) 
                 RETURNING id, email, full_name`,
                [adminEmail, hashedPassword, adminName]
            );

            console.log('\n✅ Admin account created successfully!');
            console.log(`   ID: ${result.rows[0].id}`);
        }

        console.log('\n========================================');
        console.log('🔐 ADMIN LOGIN CREDENTIALS:');
        console.log('========================================');
        console.log(`   Email:    ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

createAdmin();
