import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

// ========================
// SUBMIT A REPORT (User)
// ========================
router.post("/", async (req, res) => {
    try {
        const { userId, reportType, title, description, pageUrl } = req.body;

        if (!title || !description || !reportType) {
            return res.status(400).json({ error: "Title, description, and report type are required" });
        }

        const result = await query(
            `INSERT INTO reports (user_id, report_type, title, description, page_url, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             RETURNING id, report_type, title, status, created_at`,
            [userId || null, reportType, title, description, pageUrl || null]
        );

        res.status(201).json({
            message: "Report submitted successfully",
            report: result.rows[0]
        });
    } catch (error) {
        console.error("Report submit error:", error);
        res.status(500).json({ error: "Failed to submit report" });
    }
});

// ========================
// GET ALL REPORTS (Admin)
// ========================
router.get("/", async (req, res) => {
    try {
        const status = req.query.status; // Optional filter
        const limit = parseInt(req.query.limit) || 50;

        let queryText = `
            SELECT r.*, u.full_name as user_name, u.email as user_email
            FROM reports r
            LEFT JOIN users u ON r.user_id = u.id
        `;

        const params = [];
        if (status && status !== 'all') {
            queryText += ` WHERE r.status = $1`;
            params.push(status);
        }

        queryText += ` ORDER BY r.created_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await query(queryText, params);

        res.json({
            reports: result.rows.map(row => ({
                id: row.id,
                userId: row.user_id,
                userName: row.user_name || 'Anonymous',
                userEmail: row.user_email,
                reportType: row.report_type,
                title: row.title,
                description: row.description,
                pageUrl: row.page_url,
                status: row.status,
                adminNotes: row.admin_notes,
                createdAt: row.created_at,
                resolvedAt: row.resolved_at
            }))
        });
    } catch (error) {
        console.error("Reports fetch error:", error);
        res.status(500).json({ error: "Failed to fetch reports" });
    }
});

// ========================
// GET PENDING REPORTS COUNT (For notification badge)
// ========================
router.get("/pending-count", async (req, res) => {
    try {
        const result = await query(
            `SELECT COUNT(*) as count FROM reports WHERE status = 'pending'`
        );
        res.json({ count: parseInt(result.rows[0].count) || 0 });
    } catch (error) {
        console.error("Pending count error:", error);
        res.status(500).json({ error: "Failed to get count" });
    }
});

// ========================
// UPDATE REPORT STATUS (Admin)
// ========================
router.put("/:reportId", async (req, res) => {
    try {
        const { reportId } = req.params;
        const { status, adminNotes, resolvedBy } = req.body;

        const updates = [];
        const params = [];
        let paramCount = 1;

        if (status) {
            updates.push(`status = $${paramCount++}`);
            params.push(status);

            if (status === 'resolved' || status === 'closed') {
                updates.push(`resolved_at = NOW()`);
                if (resolvedBy) {
                    updates.push(`resolved_by = $${paramCount++}`);
                    params.push(resolvedBy);
                }
            }
        }

        if (adminNotes !== undefined) {
            updates.push(`admin_notes = $${paramCount++}`);
            params.push(adminNotes);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: "No updates provided" });
        }

        params.push(reportId);
        const result = await query(
            `UPDATE reports SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            params
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Report not found" });
        }

        res.json({
            message: "Report updated successfully",
            report: result.rows[0]
        });
    } catch (error) {
        console.error("Report update error:", error);
        res.status(500).json({ error: "Failed to update report" });
    }
});

// ========================
// DELETE REPORT (Admin)
// ========================
router.delete("/:reportId", async (req, res) => {
    try {
        const { reportId } = req.params;

        const result = await query(
            `DELETE FROM reports WHERE id = $1 RETURNING id`,
            [reportId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Report not found" });
        }

        res.json({ message: "Report deleted successfully" });
    } catch (error) {
        console.error("Report delete error:", error);
        res.status(500).json({ error: "Failed to delete report" });
    }
});

export default router;
