/**
 * Cloud Functions for handling form submissions
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { db } from "./firebase-admin.js";
import { sendFormSubmissionEmail } from "./services/emailService.js";
import * as logger from "firebase-functions/logger";

/**
 * Trigger when a new form submission is created
 * Sends email notification to the professional
 */
export const onFormSubmissionCreated = onDocumentCreated(
  {
    document: "users/{userId}/formSubmissions/{submissionId}",
    region: "us-central1",
  },
  async (event) => {
    const submissionData = event.data?.data();
    const userId = event.params.userId;
    const submissionId = event.params.submissionId;

    if (!submissionData) {
      logger.error("No submission data found");
      return;
    }

    try {
      // Get user data to check notification preferences
      const userDoc = await db.doc(`users/${userId}`).get();
      const userData = userDoc.data();

      if (!userData) {
        logger.error(`User ${userId} not found`);
        return;
      }

      // Get public form settings
      const settingsDoc = await db.doc(`users/${userId}/settings/publicForms`).get();
      const settings = settingsDoc.data();

      // Check if email notifications are enabled
      const emailEnabled = settings?.notifications?.emailEnabled ?? true;
      const recipientEmail = settings?.notifications?.emailTo || userData.email;

      if (emailEnabled && recipientEmail) {
        const professionalName = userData.name || "Profissional";
        const customerName = submissionData.customerData?.name || "Cliente";
        const appointmentType = submissionData.appointmentType === "online" ? "Online" : "Presencial";
        const submittedAt = submissionData.submittedAt?.toDate() || new Date();

        // TODO: Update with actual frontend URL
        const submissionUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/form-submissions`;

        const emailSent = await sendFormSubmissionEmail({
          recipientEmail,
          professionalName,
          customerName,
          appointmentType,
          submittedAt,
          submissionUrl,
        });

        if (emailSent) {
          logger.info(`Email notification sent to ${recipientEmail} for submission ${submissionId}`);
        } else {
          logger.error(`Failed to send email notification for submission ${submissionId}`);
        }
      }

      // Update submission count in user document (for badge)
      const userRef = db.doc(`users/${userId}`);
      await db.runTransaction(async (transaction) => {
        const userSnapshot = await transaction.get(userRef);
        const currentCount = userSnapshot.data()?.pendingSubmissionsCount || 0;
        transaction.update(userRef, {
          pendingSubmissionsCount: currentCount + 1,
        });
      });

      logger.info(`Form submission ${submissionId} processed successfully`);
    } catch (error) {
      logger.error("Error processing form submission:", error);
    }
  }
);
