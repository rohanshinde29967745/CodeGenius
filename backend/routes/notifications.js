import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

// ========================
// GET NOTIFICATIONS
// ========================
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 50;

        const result = await query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2`,
            [userId, limit]
        );

        res.json({ notifications: result.rows });
    } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({ error: "Failed to get notifications" });
    }
});

// ========================
// GET UNREAD COUNT
// ========================
router.get("/:userId/unread-count", async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await query(
            `SELECT COUNT(*) as count FROM notifications 
             WHERE user_id = $1 AND is_read = FALSE`,
            [userId]
        );

        res.json({ unreadCount: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error("Get unread count error:", error);
        res.status(500).json({ error: "Failed to get unread count" });
    }
});

// ========================
// MARK NOTIFICATION AS READ
// ========================
router.put("/:notificationId/read", async (req, res) => {
    try {
        const { notificationId } = req.params;

        await query(
            `UPDATE notifications SET is_read = TRUE WHERE id = $1`,
            [notificationId]
        );

        res.json({ message: "Notification marked as read" });
    } catch (error) {
        console.error("Mark read error:", error);
        res.status(500).json({ error: "Failed to mark notification as read" });
    }
});

// ========================
// MARK ALL AS READ
// ========================
router.put("/:userId/read-all", async (req, res) => {
    try {
        const { userId } = req.params;

        await query(
            `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
            [userId]
        );

        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Mark all read error:", error);
        res.status(500).json({ error: "Failed to mark all as read" });
    }
});

// ========================
// DELETE NOTIFICATION
// ========================
router.delete("/:notificationId", async (req, res) => {
    try {
        const { notificationId } = req.params;

        await query(
            `DELETE FROM notifications WHERE id = $1`,
            [notificationId]
        );

        res.json({ message: "Notification deleted" });
    } catch (error) {
        console.error("Delete notification error:", error);
        res.status(500).json({ error: "Failed to delete notification" });
    }
});

// ========================
// CREATE NOTIFICATION (internal use)
// ========================
router.post("/", async (req, res) => {
    try {
        const { userId, type, title, message, relatedId } = req.body;

        if (!userId || !type || !message) {
            return res.status(400).json({ error: "User ID, type, and message are required" });
        }

        const result = await query(
            `INSERT INTO notifications (user_id, type, title, message, related_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [userId, type, title || type, message, relatedId || null]
        );

        res.status(201).json({ notification: result.rows[0] });
    } catch (error) {
        console.error("Create notification error:", error);
        res.status(500).json({ error: "Failed to create notification" });
    }
});

export default router;
