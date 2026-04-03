import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import { query } from './backend/config/db.js';

async function test() {
    try {
        const res = await query(`
            SELECT id, full_name, email, role, current_level, total_points, current_xp, xp_to_next_level,
                    problems_solved, total_submissions, accepted_submissions, accuracy_rate,
                    current_streak, longest_streak,
                    bio, location, github_url, linkedin_url, profile_photo_url,
                    theme_preference, created_at, updated_at, last_login_at, last_activity_at
             FROM users
        `);
        console.log(res.rows.length + ' users found');
        process.exit(0);
    } catch(err) {
        console.error("DB QUERY ERROR:", err);
        process.exit(1);
    }
}
test();
