import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentWritten, onDocumentCreated } from "firebase-functions/v2/firestore";
import { db } from "./firebase-admin.js";
import { getMercadoPagoService } from "./services/MercadoPagoService.js";

/**
 * Create a subscription
 *
 * Called from frontend when user selects a paid plan
 */
export const createSubscription = onCall(
  { timeoutSeconds: 60, memory: "512MiB" },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { planTier, billingInterval } = request.data;

    // Validate inputs
    if (!["starter", "professional", "enterprise"].includes(planTier)) {
      throw new HttpsError("invalid-argument", "Invalid plan tier");
    }

    if (!["monthly", "annual"].includes(billingInterval)) {
      throw new HttpsError("invalid-argument", "Invalid billing interval");
    }

    try {
      // Get user data
      const userDoc = await db.collection("users").doc(uid).get();
      const userData = userDoc.data();

      if (!userData) {
        throw new HttpsError("not-found", "User not found");
      }

      // Check if user has permanent free access
      if (userData.permanentFree) {
        throw new HttpsError(
          "failed-precondition",
          "This account has permanent free access"
        );
      }

      const email = userData.email || request.auth?.token.email;
      const name = userData.name || request.auth?.token.name || "";
      const [firstName, ...lastNameParts] = name.split(" ");
      const lastName = lastNameParts.join(" ");

      // Create subscription in Mercado Pago
      const mercadoPago = getMercadoPagoService();
      const subscription = await mercadoPago.createSubscription({
        email,
        firstName: firstName || "Usuario",
        lastName: lastName || "NutriOffice",
        planTier,
        billingInterval,
      });

      // Update user document with pending subscription
      const now = new Date();
      const periodEnd = new Date();
      if (billingInterval === "annual") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      await db
        .collection("users")
        .doc(uid)
        .update({
          subscription: {
            planTier,
            status: "inactive", // Will be updated to 'active' after payment
            billingInterval,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
            mercadoPagoSubscriptionId: subscription.id,
            mercadoPagoCustomerId: subscription.customerId,
            createdAt: now,
            updatedAt: now,
          },
        });

      // Log payment history
      await db
        .collection("users")
        .doc(uid)
        .collection("paymentHistory")
        .add({
          event: "subscription_created",
          planTier,
          metadata: {
            subscriptionId: subscription.id,
            customerId: subscription.customerId,
          },
          createdAt: now,
        });

      // Return init point URL for redirect
      return {
        subscriptionId: subscription.id,
        initPoint: subscription.initPoint,
      };
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      throw new HttpsError("internal", error.message || "Failed to create subscription");
    }
  }
);

/**
 * Cancel a subscription
 *
 * Called when user wants to cancel their subscription
 */
export const cancelSubscription = onCall(
  { timeoutSeconds: 60, memory: "512MiB" },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    try {
      // Get user's subscription
      const userDoc = await db.collection("users").doc(uid).get();
      const userData = userDoc.data();
      const subscription = userData?.subscription;

      if (!subscription || !subscription.mercadoPagoSubscriptionId) {
        throw new HttpsError("not-found", "No active subscription found");
      }

      // Cancel in Mercado Pago
      const mercadoPago = getMercadoPagoService();
      await mercadoPago.cancelSubscription(subscription.mercadoPagoSubscriptionId);

      // Update subscription to cancel at period end
      await db
        .collection("users")
        .doc(uid)
        .update({
          "subscription.cancelAtPeriodEnd": true,
          "subscription.updatedAt": new Date(),
        });

      // Log payment history
      await db
        .collection("users")
        .doc(uid)
        .collection("paymentHistory")
        .add({
          event: "canceled",
          planTier: subscription.planTier,
          createdAt: new Date(),
        });

      return { success: true };
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      throw new HttpsError("internal", error.message || "Failed to cancel subscription");
    }
  }
);

/**
 * Upgrade/downgrade subscription
 *
 * Changes the plan tier
 */
export const changeSubscription = onCall(
  { timeoutSeconds: 60, memory: "512MiB" },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { newPlanTier, newBillingInterval } = request.data;

    if (!["starter", "professional", "enterprise"].includes(newPlanTier)) {
      throw new HttpsError("invalid-argument", "Invalid plan tier");
    }

    try {
      const userDoc = await db.collection("users").doc(uid).get();
      const userData = userDoc.data();
      const currentSubscription = userData?.subscription;

      if (!currentSubscription) {
        throw new HttpsError("not-found", "No subscription found");
      }

      // Cancel old subscription
      const mercadoPago = getMercadoPagoService();
      if (currentSubscription.mercadoPagoSubscriptionId) {
        await mercadoPago.cancelSubscription(
          currentSubscription.mercadoPagoSubscriptionId
        );
      }

      // Create new subscription
      const email = userData.email;
      const name = userData.name || "";
      const [firstName, ...lastNameParts] = name.split(" ");
      const lastName = lastNameParts.join(" ");

      const newSubscription = await mercadoPago.createSubscription({
        email,
        firstName: firstName || "Usuario",
        lastName: lastName || "NutriOffice",
        planTier: newPlanTier,
        billingInterval: newBillingInterval || currentSubscription.billingInterval,
      });

      // Update subscription
      const now = new Date();
      const periodEnd = new Date();
      if (newBillingInterval === "annual") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      await db
        .collection("users")
        .doc(uid)
        .update({
          subscription: {
            planTier: newPlanTier,
            status: "inactive",
            billingInterval: newBillingInterval || currentSubscription.billingInterval,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
            mercadoPagoSubscriptionId: newSubscription.id,
            mercadoPagoCustomerId: newSubscription.customerId,
            createdAt: currentSubscription.createdAt,
            updatedAt: now,
          },
        });

      // Log change
      const isUpgrade =
        ["free", "starter", "professional", "enterprise"].indexOf(newPlanTier) >
        ["free", "starter", "professional", "enterprise"].indexOf(
          currentSubscription.planTier
        );

      await db
        .collection("users")
        .doc(uid)
        .collection("paymentHistory")
        .add({
          event: isUpgrade ? "upgraded" : "downgraded",
          planTier: newPlanTier,
          metadata: {
            oldPlan: currentSubscription.planTier,
            newPlan: newPlanTier,
          },
          createdAt: now,
        });

      return {
        subscriptionId: newSubscription.id,
        initPoint: newSubscription.initPoint,
      };
    } catch (error: any) {
      console.error("Error changing subscription:", error);
      throw new HttpsError("internal", error.message || "Failed to change subscription");
    }
  }
);

/**
 * Webhook handler for Mercado Pago notifications
 *
 * Receives payment and subscription status updates
 */
export const mercadoPagoWebhook = onRequest(
  { timeoutSeconds: 60, memory: "512MiB" },
  async (req, res) => {
    // Only accept POST requests
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const signature = req.headers["x-signature"] as string;
      const requestId = req.headers["x-request-id"] as string;

      // Verify webhook signature
      const mercadoPago = getMercadoPagoService();
      const isValid = mercadoPago.verifyWebhookSignature(
        req.body,
        signature,
        requestId
      );

      if (!isValid) {
        console.warn("Invalid webhook signature");
        res.status(401).send("Invalid signature");
        return;
      }

      // Process webhook
      const result = await mercadoPago.processWebhook(req.body);

      if (!result) {
        res.status(200).send("OK");
        return;
      }

      // Handle payment notification
      if (result.type === "payment" && result.payment) {
        const payment = result.payment;

        // Find user by Mercado Pago customer ID
        const usersSnapshot = await db
          .collection("users")
          .where("subscription.mercadoPagoCustomerId", "==", payment.payer?.id)
          .limit(1)
          .get();

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          const uid = userDoc.id;

          // Update subscription status based on payment
          const updateData: any = {
            "subscription.lastPaymentStatus": payment.status,
            "subscription.lastPaymentDate": new Date(),
            "subscription.updatedAt": new Date(),
          };

          if (payment.status === "approved") {
            updateData["subscription.status"] = "active";

            // Log successful payment
            await db
              .collection("users")
              .doc(uid)
              .collection("paymentHistory")
              .add({
                event: "payment_succeeded",
                amount: payment.transaction_amount,
                metadata: {
                  paymentId: payment.id,
                  paymentMethod: payment.payment_method_id,
                },
                createdAt: new Date(),
              });
          } else if (payment.status === "rejected") {
            updateData["subscription.status"] = "past_due";

            // Log failed payment
            await db
              .collection("users")
              .doc(uid)
              .collection("paymentHistory")
              .add({
                event: "payment_failed",
                amount: payment.transaction_amount,
                metadata: {
                  paymentId: payment.id,
                  reason: payment.status_detail,
                },
                createdAt: new Date(),
              });
          }

          await db.collection("users").doc(uid).update(updateData);
        }
      }

      // Handle subscription notification
      if (result.type === "subscription" && result.subscription) {
        const subscription = result.subscription;

        // Find user by subscription ID
        const usersSnapshot = await db
          .collection("users")
          .where("subscription.mercadoPagoSubscriptionId", "==", subscription.id)
          .limit(1)
          .get();

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          const uid = userDoc.id;

          // Map Mercado Pago status to our status
          let status = "inactive";
          if (subscription.status === "authorized") status = "active";
          else if (subscription.status === "paused") status = "past_due";
          else if (subscription.status === "cancelled") status = "canceled";

          await db
            .collection("users")
            .doc(uid)
            .update({
              "subscription.status": status,
              "subscription.updatedAt": new Date(),
            });
        }
      }

      res.status(200).send("OK");
    } catch (error: any) {
      console.error("Error processing webhook:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

/**
 * Trigger to update customer count when customers are added/removed
 */
export const updateCustomerCount = onDocumentWritten(
  { document: "users/{userId}/customers/{customerId}" },
  async (event) => {
    const userId = event.params.userId;

    try {
      // Count total customers
      const customersSnapshot = await db
        .collection("users")
        .doc(userId)
        .collection("customers")
        .count()
        .get();

      const customerCount = customersSnapshot.data().count;

      // Update user document
      await db.collection("users").doc(userId).update({
        currentCustomerCount: customerCount,
      });

      console.log(`Updated customer count for user ${userId}: ${customerCount}`);
    } catch (error) {
      console.error("Error updating customer count:", error);
    }
  }
);

/**
 * Check if user needs to upgrade based on customer count
 *
 * Triggered when currentCustomerCount changes
 */
export const checkSubscriptionLimits = onDocumentWritten(
  { document: "users/{userId}" },
  async (event) => {
    const after = event.data?.after;
    const before = event.data?.before;

    if (!after || !after.exists) return;

    const afterData = after.data();
    const beforeData = before?.data();

    if (!afterData) return;

    // Only check if customer count changed
    if (
      !afterData.currentCustomerCount ||
      afterData.currentCustomerCount === beforeData?.currentCustomerCount
    ) {
      return;
    }

    const userId = event.params.userId;
    const customerCount = afterData.currentCustomerCount;
    const subscription = afterData.subscription;
    const permanentFree = afterData.permanentFree;

    // Skip for permanent free accounts
    if (permanentFree) return;

    // Determine required tier
    let requiredTier = "free";
    if (customerCount > 50 && customerCount <= 200) requiredTier = "starter";
    else if (customerCount > 200 && customerCount <= 500) requiredTier = "professional";
    else if (customerCount > 500) requiredTier = "enterprise";

    const currentTier = subscription?.planTier || "free";

    // Check if upgrade is needed
    const tiers = ["free", "starter", "professional", "enterprise"];
    const requiredIndex = tiers.indexOf(requiredTier);
    const currentIndex = tiers.indexOf(currentTier);

    if (requiredIndex > currentIndex) {
      console.log(
        `User ${userId} needs to upgrade from ${currentTier} to ${requiredTier}`
      );

      // In a real app, you might want to:
      // 1. Send an email notification
      // 2. Create a notification in the app
      // 3. Disable certain features until upgrade

      // For now, just log it
      // The frontend will check limits in real-time via Firestore rules
    }
  }
);

/**
 * Initialize free tier subscription for new users
 *
 * Triggered when a new user document is created (PROFESSIONAL only)
 */
export const initializeFreeTierOnUserCreation = onDocumentCreated(
  { document: "users/{userId}" },
  async (event) => {
    const userId = event.params.userId;
    const userData = event.data?.data();

    if (!userData) {
      console.log("No user data found");
      return;
    }

    // Only initialize subscription for PROFESSIONAL users
    // Collaborators inherit from the professional they contribute to
    const isProfessional = userData.roles?.ability === "PROFESSIONAL";
    if (!isProfessional) {
      console.log(`User ${userId} is not a professional, skipping subscription init`);
      return;
    }

    // Check if subscription already exists
    if (userData.subscription) {
      console.log(`User ${userId} already has a subscription`);
      return;
    }

    try {
      const now = new Date();
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

      await db
        .collection("users")
        .doc(userId)
        .update({
          subscription: {
            planTier: "free",
            status: "active",
            billingInterval: "monthly",
            currentPeriodStart: now,
            currentPeriodEnd: oneYearLater,
            cancelAtPeriodEnd: false,
            createdAt: now,
            updatedAt: now,
          },
          currentCustomerCount: 0,
        });

      // Log subscription creation
      await db
        .collection("users")
        .doc(userId)
        .collection("paymentHistory")
        .add({
          event: "subscription_created",
          planTier: "free",
          metadata: {
            initialTier: true,
          },
          createdAt: now,
        });

      console.log(`Successfully initialized free tier for user ${userId}`);
    } catch (error: any) {
      console.error(`Error initializing free tier for user ${userId}:`, error);
      // Don't throw - this is a non-critical operation
    }
  }
);
