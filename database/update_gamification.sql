-- Enhanced Trigger Function for Gamification (XP, Levels, Badges)
CREATE OR REPLACE FUNCTION update_user_stats_after_submission()
RETURNS TRIGGER AS $$
DECLARE
    v_problems_solved INTEGER;
    v_total_points INTEGER;
    v_new_xp INTEGER;
    v_new_level VARCHAR(20);
    v_xp_to_next INTEGER;
    v_accuracy DECIMAL(5,2);
    v_total_subs INTEGER;
BEGIN
    -- 1. Update basic stats (submissions, points, problems solved)
    UPDATE users 
    SET 
        total_submissions = total_submissions + 1,
        accepted_submissions = accepted_submissions + CASE WHEN NEW.status = 'Accepted' THEN 1 ELSE 0 END,
        problems_solved = (
            SELECT COUNT(DISTINCT problem_id) 
            FROM submissions 
            WHERE user_id = NEW.user_id AND status = 'Accepted'
        ),
        total_points = total_points + NEW.points_earned,
        last_activity_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.user_id
    RETURNING problems_solved, total_points, total_submissions, accuracy_rate INTO v_problems_solved, v_total_points, v_total_subs, v_accuracy;

    -- 2. Calculate XP (Points * 10 multiplier for more granular XP)
    -- Or simpler: Current XP + (Points Earned * 5)
    UPDATE users
    SET current_xp = current_xp + (NEW.points_earned * 5)
    WHERE id = NEW.user_id
    RETURNING current_xp INTO v_new_xp;

    -- 3. Determine Level based on new XP
    IF v_new_xp < 1000 THEN
        v_new_level := 'Bronze';
        v_xp_to_next := 1000 - v_new_xp;
    ELSIF v_new_xp < 2500 THEN
        v_new_level := 'Silver';
        v_xp_to_next := 2500 - v_new_xp;
    ELSIF v_new_xp < 5000 THEN
        v_new_level := 'Gold';
        v_xp_to_next := 5000 - v_new_xp;
    ELSE
        v_new_level := 'Platinum';
        v_xp_to_next := 0;
    END IF;

    -- Update Level and XP to next
    UPDATE users 
    SET 
        current_level = v_new_level,
        xp_to_next_level = v_xp_to_next
    WHERE id = NEW.user_id;

    -- 4. Check and Award Badges (Only on Accepted submissions)
    IF NEW.status = 'Accepted' THEN
        
        -- Badge: Bronze (10 problems)
        IF v_problems_solved >= 10 THEN
            INSERT INTO user_badges (user_id, badge_id, is_earned, earned_at)
            SELECT NEW.user_id, id, TRUE, NOW()
            FROM badges WHERE name = 'Bronze'
            ON CONFLICT (user_id, badge_id) DO UPDATE SET is_earned = TRUE;
        END IF;

        -- Badge: Silver (25 problems)
        IF v_problems_solved >= 25 THEN
            INSERT INTO user_badges (user_id, badge_id, is_earned, earned_at)
            SELECT NEW.user_id, id, TRUE, NOW()
            FROM badges WHERE name = 'Silver'
            ON CONFLICT (user_id, badge_id) DO UPDATE SET is_earned = TRUE;
        END IF;

        -- Badge: Gold (50 problems)
        IF v_problems_solved >= 50 THEN
            INSERT INTO user_badges (user_id, badge_id, is_earned, earned_at)
            SELECT NEW.user_id, id, TRUE, NOW()
            FROM badges WHERE name = 'Gold'
            ON CONFLICT (user_id, badge_id) DO UPDATE SET is_earned = TRUE;
        END IF;

        -- Badge: Platinum (100 problems)
        IF v_problems_solved >= 100 THEN
            INSERT INTO user_badges (user_id, badge_id, is_earned, earned_at)
            SELECT NEW.user_id, id, TRUE, NOW()
            FROM badges WHERE name = 'Platinum'
            ON CONFLICT (user_id, badge_id) DO UPDATE SET is_earned = TRUE;
        END IF;

        -- Badge: Problem Solver (90% accuracy & >10 submissions)
        -- Need to recalculate accuracy first
        IF v_total_subs > 10 THEN
             -- Get latest accuracy
             SELECT accuracy_rate INTO v_accuracy FROM users WHERE id = NEW.user_id;
             
             IF v_accuracy >= 90.00 THEN
                INSERT INTO user_badges (user_id, badge_id, is_earned, earned_at)
                SELECT NEW.user_id, id, TRUE, NOW()
                FROM badges WHERE name = 'Problem Solver'
                ON CONFLICT (user_id, badge_id) DO UPDATE SET is_earned = TRUE;
             END IF;
        END IF;

    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
