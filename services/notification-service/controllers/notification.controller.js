import { db } from "../firebase/firebaseAdmin.js";

// Send new notification
export const sendNotification = async (req, res) => {
  try {
    const { type, title, description, link, userId } = req.body;
    const data = {
      type,
      title,
      description,
      link: link || null,
      userId,
      status: "pending",
      timestamp: new Date(),
    };

    const notifRef = await db.collection("notifications").add(data);
    res.status(201).json({ id: notifRef.id, ...data });
  } catch (error) {
    res.status(500).json({ message: "Error sending notification", error });
  }
};

// Accept or reject a team invite
export const updateNotificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    await db.collection("notifications").doc(id).update({ status });
    res.status(200).json({ message: `Notification ${status}` });
  } catch (error) {
    res.status(500).json({ message: "Error updating status", error });
  }
};
