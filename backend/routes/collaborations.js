import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

// Initialize table if not exists
const initTable = async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS collaboration_requests (
                id SERIAL PRIMARY KEY,
                project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                description TEXT NOT NULL,
                requester_email VARCHAR(255) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'ignored')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(project_id, requester_id)
            )
        `);
        console.log("✅ Collaboration requests table ready");
    } catch (error) {
        console.error("Error creating collaboration_requests table:", error.message);
    }
};

// Run init on module load
initTable();

// ========================
// SEND COLLABORATION REQUEST
// ========================
router.post("/", async (req, res) => {
    try {
        const { projectId, requesterId, ownerId, description, requesterEmail } = req.body;

        if (!projectId || !requesterId || !ownerId || !description || !requesterEmail) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Check if request already exists
        const existing = await query(
            `SELECT id FROM collaboration_requests WHERE project_id = $1 AND requester_id = $2`,
            [projectId, requesterId]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: "You have already sent a request for this project" });
        }

        // Create the request
        const result = await query(
            `INSERT INTO collaboration_requests (project_id, requester_id, owner_id, description, requester_email)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, project_id, description, requester_email, status, created_at`,
            [projectId, requesterId, ownerId, description, requesterEmail]
        );

        res.status(201).json({
            message: "Collaboration request sent successfully!",
            request: result.rows[0]
        });
    } catch (error) {
        console.error("Send collaboration request error:", error);
        res.status(500).json({ error: "Failed to send collaboration request" });
    }
});

// ========================
// GET RECEIVED REQUESTS (for project owners)
// ========================
router.get("/received/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await query(
            `SELECT cr.id, cr.project_id, cr.description, cr.requester_email, cr.status, cr.created_at,
                    p.title as project_title,
                    u.full_name as requester_name, u.email as requester_user_email
             FROM collaboration_requests cr
             JOIN projects p ON cr.project_id = p.id
             JOIN users u ON cr.requester_id = u.id
             WHERE cr.owner_id = $1
             ORDER BY cr.created_at DESC`,
            [userId]
        );

        res.json({ requests: result.rows });
    } catch (error) {
        console.error("Get received requests error:", error);
        res.status(500).json({ error: "Failed to fetch collaboration requests" });
    }
});

// ========================
// GET SENT REQUESTS (for requesters)
// ========================
router.get("/sent/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await query(
            `SELECT cr.id, cr.project_id, cr.description, cr.status, cr.created_at,
                    p.title as project_title,
                    u.full_name as owner_name
             FROM collaboration_requests cr
             JOIN projects p ON cr.project_id = p.id
             JOIN users u ON cr.owner_id = u.id
             WHERE cr.requester_id = $1
             ORDER BY cr.created_at DESC`,
            [userId]
        );

        res.json({ requests: result.rows });
    } catch (error) {
        console.error("Get sent requests error:", error);
        res.status(500).json({ error: "Failed to fetch sent requests" });
    }
});

// ========================
// ACCEPT REQUEST
// ========================
router.put("/:requestId/accept", async (req, res) => {
    try {
        const { requestId } = req.params;
        const { userId } = req.body;

        // Verify ownership
        const request = await query(
            `SELECT owner_id FROM collaboration_requests WHERE id = $1`,
            [requestId]
        );

        if (request.rows.length === 0) {
            return res.status(404).json({ error: "Request not found" });
        }

        if (request.rows[0].owner_id !== userId) {
            return res.status(403).json({ error: "Not authorized" });
        }

        // Update status
        await query(
            `UPDATE collaboration_requests SET status = 'accepted' WHERE id = $1`,
            [requestId]
        );

        res.json({ message: "Request accepted", status: "accepted" });
    } catch (error) {
        console.error("Accept request error:", error);
        res.status(500).json({ error: "Failed to accept request" });
    }
});

// ========================
// IGNORE REQUEST
// ========================
router.put("/:requestId/ignore", async (req, res) => {
    try {
        const { requestId } = req.params;
        const { userId } = req.body;

        // Verify ownership
        const request = await query(
            `SELECT owner_id FROM collaboration_requests WHERE id = $1`,
            [requestId]
        );

        if (request.rows.length === 0) {
            return res.status(404).json({ error: "Request not found" });
        }

        if (request.rows[0].owner_id !== userId) {
            return res.status(403).json({ error: "Not authorized" });
        }

        // Update status
        await query(
            `UPDATE collaboration_requests SET status = 'ignored' WHERE id = $1`,
            [requestId]
        );

        res.json({ message: "Request ignored", status: "ignored" });
    } catch (error) {
        console.error("Ignore request error:", error);
        res.status(500).json({ error: "Failed to ignore request" });
    }
});

// ========================
// DELETE REQUEST (for requesters to cancel)
// ========================
router.delete("/:requestId", async (req, res) => {
    try {
        const { requestId } = req.params;
        const { userId } = req.body;

        await query(
            `DELETE FROM collaboration_requests WHERE id = $1 AND requester_id = $2`,
            [requestId, userId]
        );

        res.json({ message: "Request cancelled" });
    } catch (error) {
        console.error("Delete request error:", error);
        res.status(500).json({ error: "Failed to delete request" });
    }
});

export default router;
