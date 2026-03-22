import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/codegenius'
});

async function resetPassword() {
    const email = 'rs9130732@gmail.com';
    const newPassword = 'password123';

    try {
        // First check if user exists
        const checkResult = await pool.query('SELECT id, email, role FROM users WHERE email = $1', [email.toLowerCase()]);

        if (checkResult.rows.length === 0) {
            console.log('❌ User not found with email:', email);
            pool.end();
            return;
        }

        console.log('✅ User found:', checkResult.rows[0].email, '| Role:', checkResult.rows[0].role);

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        // Update password
        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email, role',
            [hash, email.toLowerCase()]
        );

        console.log('✅ Password reset successful!');
        console.log('📧 Email:', result.rows[0].email);
        console.log('👤 Role:', result.rows[0].role);
        console.log('🔑 New password: password123');
        console.log('\nYou can now login with:');
        console.log('Email:', email);
        console.log('Password: password123');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        pool.end();
    }
}

resetPassword();
