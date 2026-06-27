import { logger } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

import { db, auth, storage } from "./firebase-admin.js";
import { sendInvitationEmail } from "./services/emailService.js";
import { BodyCompositionService } from "./services/BodyCompositionService.js";

// Helper function for backward compatibility with old "NUTRI" role
function isProfessionalRole(role: string | undefined): boolean {
  return role === "PROFESSIONAL" || role === "NUTRI";
}

// Hardcoded userId for development - remove in production
// const userId = "P0gkEAaP8YSARPyS5pKak6ZWss13";
const app = express();
app.use(cors({origin: true}));

/**
 * 🔐 Authentication Middleware
 * Verifies Bearer token from Authorization header.
 */
const authenticate = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization || "";
    const match = authHeader.match(/^Bearer (.+)$/);

    if (!match) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const idToken = match[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;

    // Optional: enforce route ownership
    const { userId } = req.params;
    if (userId && req.user.uid !== userId) {
      return res.status(403).json({ error: "Access denied: userId mismatch" });
    }

    next();
  } catch (error: any) {
    console.error("Auth error:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Apply authentication middleware to all routes under users
app.use("/users/:userId", authenticate);

app.get("/", (req, res) => {
  return res.status(200).send("Hello world");
});

// Example GET endpoint
app.get("/users/:userId/customers/:customerId", async (req, res) => {
  try {
    const { userId, customerId } = req.params;
    const customerDoc = await db.collection(
        "/users/" + userId + "/customers",
    ).doc(customerId).get();
    if (!customerDoc.exists) {
      return res.status(404).send("User not found");
    }
    return res.status(200).json(customerDoc.data());
  } catch (error) {
    console.error("Error getting customer:", error);
    return res.status(500).send("Internal Server Error");
  }
});

app.get("/users/:userId/inactive-customers", async (req, res) => {
  try {
    const { userId } = req.params;

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Query all customers whose lastConsultaDate is older than one year
    const customersRef = db
      .collection("/users/" + userId + "/customers")
      .where('lastConsultaDate', '<', oneYearAgo);

    const snapshot = await customersRef.get();

    const result = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        name: data.name as string,
        phone: data.phone as string,
        date: data.lastConsultaDate
          ? (data.lastConsultaDate as FirebaseFirestore.Timestamp)
              .toDate()
              .toISOString()
          : null,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error getting inactive customers:', error);
    return res.status(500).send('Internal Server Error');
  }
});

app.post("/users/:userId/customer-anamnesis-consulta", async (req, res) => {
  try {
    const { userId } = req.params;
    const customersRef = db.collection("/users/" + userId + "/customers");
    const { cpf, customerData, anamnesisData, consultaData } = req.body;

    if (!cpf || !customerData || !anamnesisData) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    // Find customer by CPF
    const existing = await customersRef.where("cpf", "==", cpf).limit(1).get();
    let customerId;

    if (!existing.empty) {
      // Customer exists
      customerId = existing.docs[0].id;
      console.log(`Found existing customer: ${customerId}`);
    } else {
      // Customer doesn't exist → create new one
      const newCustomerRef = await customersRef.add({
        cpf,
        ...customerData,
        createdAt: FieldValue.serverTimestamp(),
      });
      customerId = newCustomerRef.id;
      console.log(`Created new customer: ${customerId}`);
    }

    // Create new anamnesis under this customer
    const anamnesisRef = await customersRef
      .doc(customerId)
      .collection("anamnesis")
      .add({
        ...anamnesisData,
        createdAt: FieldValue.serverTimestamp(),
      });

    // Create new consulta if data is provided
    let consultaId;
    if (consultaData && Object.keys(consultaData).length > 0) {
      const consultaRef = await customersRef
        .doc(customerId)
        .collection("consultas")
        .add({
          ...consultaData,
          anamnesis_id: anamnesisRef.id,
          createdAt: FieldValue.serverTimestamp(),
        });
      consultaId = consultaRef.id;
      console.log(`Created new consulta: ${consultaId}`);
    }

    const responseMessage = consultaId
      ? "Customer, Anamnesis, and Consulta created successfully"
      : "Customer and Anamnesis created successfully";

    return res.status(201).json({
      message: responseMessage,
      customerId,
      anamnesisId: anamnesisRef.id,
      ...(consultaId && { consultaId }),
    });
  } catch (error) {
    console.error("Error in /customer-anamnesis:", error);
    return res.status(500).send("Internal Server Error");
  }
})

/**
 * GET /users/:userId/customers
 * Returns all customers for a user
 */
app.get("/users/:userId/customers", async (req, res) => {
  try {
    const { userId } = req.params;
    const customersRef = db.collection("users").doc(userId).collection("customers");
    const snapshot = await customersRef.orderBy("createdAt", "desc").get();

    const customers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(customers);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /users/:userId/customers
 * Creates a customer for user with userId
 */
app.post("/users/:userId/customers", async (req, res) => {
  try {
    const { userId } = req.params;
    const customersRef = db.collection("/users/" + userId + "/customers");
    const { cpf, customerData } = req.body;

    if (!cpf || !customerData) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    // Find customer by CPF
    const existing = await customersRef.where("cpf", "==", cpf).limit(1).get();
    let customerId;
    let responseMessage;

    if (!existing.empty) {
      // Customer exists
      customerId = existing.docs[0].id;
      responseMessage = `Found existing customer: ${customerId}`
      console.log(responseMessage);
    } else {
      // Customer doesn't exist → create new one
      const newCustomerRef = await customersRef.add({
        cpf,
        ...customerData,
        createdAt: FieldValue.serverTimestamp(),
      });
      customerId = newCustomerRef.id;
      responseMessage = `Created new customer: ${customerId}`
      console.log(responseMessage);
    }
    
    return res.status(201).json({
      message: responseMessage,
      customerId,
    });
  } catch (error) {
    console.error("Error in /users/:userId/customers:", error);
    return res.status(500).send("Internal Server Error");
  }
})

/**
 * GET /users/:userId/customers/:customerId/anamnesis
 * Returns all anamneses for a specific customer
 */
app.get("/users/:userId/customers/:customerId/anamnesis", async (req, res) => {
  try {
    const { userId, customerId } = req.params;
    const anamnesisRef = db
      .collection("users")
      .doc(userId)
      .collection("customers")
      .doc(customerId)
      .collection("anamnesis");

    const snapshot = await anamnesisRef.orderBy("createdAt", "desc").get();

    const anamneses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(anamneses);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /users/:userId/customers/:customerId/anamnesis
 * Creates an anamnesis for a specific customer
 */
app.post("/users/:userId/customers/:customerId/anamnesis", async (req, res) => {
  try {
    const { userId, customerId } = req.params;
    const { anamnesisData } = req.body;

    if (!anamnesisData) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const customerRef = db
      .collection("users")
      .doc(userId)
      .collection("customers")
      .doc(customerId);

    if (!customerRef) {
      // Customer doesn't exists
       return res.status(400).json({ error: `Customer ${customerId} not found` });
    }

    const newAnamnesisRef = await customerRef
      .collection("anamnesis")
      .add({
        ...anamnesisData,
        createdAt: FieldValue.serverTimestamp(),
      });
    
    return res.status(201).json({
      message: `Anamnesis created successfully ${newAnamnesisRef.id}`,
      customerId,
    });
  } catch (error) {
    console.error("Error in /users/:userId/customers:", error);
    return res.status(500).send("Internal Server Error");
  }
});

/**
 * GET /users/:userId/customers/:customerId/consultas
 * Returns all consultas for a customer
 */
app.get("/users/:userId/customers/:customerId/consultas", async (req, res) => {
  try {
    const { userId, customerId } = req.params;
    const consultasRef = db
      .collection("users")
      .doc(userId)
      .collection("customers")
      .doc(customerId)
      .collection("consultas");

    const snapshot = await consultasRef.orderBy("createdAt", "desc").get();

    const consultas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(consultas);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /users/:userId/customers/:customerId/consultas
 * Creates a consulta for a specific customer
 */
app.post("/users/:userId/customers/:customerId/consultas", async (req, res) => {
  try {
    const { userId, customerId } = req.params;
    const { consultaData } = req.body;

    if (!consultaData) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const customerRef = db
      .collection("users")
      .doc(userId)
      .collection("customers")
      .doc(customerId);

    if (!customerRef) {
      // Customer doesn't exists
       return res.status(400).json({ error: `Customer ${customerId} not found` });
    }

    const newConsultaRef = await customerRef
      .collection("consulta")
      .add({
        ...consultaData,
        createdAt: FieldValue.serverTimestamp(),
      });
    
    return res.status(201).json({
      message: `Consulta created successfully ${newConsultaRef.id}`,
      customerId,
    });
  } catch (error) {
    console.error("Error in /users/:userId/customers:", error);
    return res.status(500).send("Internal Server Error");
  }
});

/**
 * ========================================
 * INVITATION ENDPOINTS
 * ========================================
 */

/**
 * POST /users/:userId/invitations
 * Send invitation to a collaborator
 * Requires: PROFESSIONAL role
 */
app.post("/users/:userId/invitations", async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, role, permissions } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: "Missing required fields: email, role" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Get professional user data
    const professionalDoc = await db.collection("users").doc(userId).get();
    if (!professionalDoc.exists) {
      return res.status(404).json({ error: "Professional not found" });
    }

    const professionalData = professionalDoc.data();
    const professionalRole = professionalData?.roles?.ability;

    // Only PROFESSIONAL role can send invitations
    if (!isProfessionalRole(professionalRole)) {
      return res.status(403).json({ error: "Only professionals can send invitations" });
    }

    // Check collaborator limit (5 max)
    const contributorsRef = db.collection("users").doc(userId).collection("contributors");
    const contributorsSnapshot = await contributorsRef.get();
    const currentCollaboratorCount = contributorsSnapshot.size;

    if (currentCollaboratorCount >= 5) {
      return res.status(400).json({
        error: "Collaborator limit reached",
        message: "You have reached the maximum of 5 collaborators. Please upgrade your plan to add more.",
      });
    }

    // Check if invitation already exists for this email
    const existingInvitation = await db
      .collection("invitations")
      .where("email", "==", email.toLowerCase())
      .where("professionalId", "==", userId)
      .where("status", "==", "pending")
      .get();

    if (!existingInvitation.empty) {
      return res.status(400).json({
        error: "Invitation already sent",
        message: "An active invitation already exists for this email.",
      });
    }

    // Check if user already exists with this email
    try {
      const existingUser = await auth.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          error: "User already exists",
          message: "A user with this email already exists in the system.",
        });
      }
    } catch (error: any) {
      // User not found is expected, continue with invitation
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
    }

    // Generate secure token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Create invitation document
    const invitationRef = await db.collection("invitations").add({
      email: email.toLowerCase(),
      professionalId: userId,
      professionalName: professionalData?.name || "Professional",
      role,
      permissions: permissions || [],
      status: "pending",
      token,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
    });

    // Send invitation email
    const emailSent = await sendInvitationEmail({
      recipientEmail: email,
      professionalName: professionalData?.name || "Professional",
      role,
      token,
      expiresAt,
    });

    if (!emailSent) {
      logger.warn(`Invitation created but email failed to send: ${invitationRef.id}`);
    }

    return res.status(201).json({
      message: "Invitation sent successfully",
      invitationId: invitationRef.id,
      emailSent,
    });
  } catch (error: any) {
    console.error("Error sending invitation:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

/**
 * GET /users/:userId/invitations
 * Get all invitations for a professional
 */
app.get("/users/:userId/invitations", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    const snapshot = await db
      .collection("invitations")
      .where("professionalId", "==", userId)
      .get();

    const invitations = snapshot.docs
      .filter((doc) => !status || doc.data().status === status)
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          role: data.role,
          permissions: data.permissions,
          status: data.status,
          createdAt: data.createdAt?.toDate().toISOString(),
          expiresAt: data.expiresAt?.toDate().toISOString(),
        };
      })
      .sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.localeCompare(a.createdAt);
      });

    return res.status(200).json(invitations);
  } catch (error: any) {
    console.error("Error fetching invitations:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * GET /invitations/:token
 * Get invitation details by token (no auth required for registration flow)
 */
app.get("/invitations/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const snapshot = await db
      .collection("invitations")
      .where("token", "==", token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    const invitationDoc = snapshot.docs[0];
    const invitation = invitationDoc.data();

    // Check if invitation is expired
    const expiresAt = invitation.expiresAt?.toDate();
    if (expiresAt && expiresAt < new Date()) {
      // Update status to expired
      await invitationDoc.ref.update({ status: "expired" });
      return res.status(400).json({ error: "Invitation expired" });
    }

    // Check if invitation is already accepted or revoked
    if (invitation.status !== "pending") {
      return res.status(400).json({ error: `Invitation ${invitation.status}` });
    }

    return res.status(200).json({
      id: invitationDoc.id,
      email: invitation.email,
      professionalName: invitation.professionalName,
      role: invitation.role,
      status: invitation.status,
      expiresAt: expiresAt?.toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching invitation:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /invitations/:token/accept
 * Accept invitation and create user relationship
 * Body: { userId: string } - newly created user ID
 */
app.post("/invitations/:token/accept", async (req, res) => {
  try {
    const { token } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // Get invitation
    const snapshot = await db
      .collection("invitations")
      .where("token", "==", token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    const invitationDoc = snapshot.docs[0];
    const invitation = invitationDoc.data();

    // Validate invitation
    if (invitation.status !== "pending") {
      return res.status(400).json({ error: "Invitation already processed" });
    }

    const expiresAt = invitation.expiresAt?.toDate();
    if (expiresAt && expiresAt < new Date()) {
      await invitationDoc.ref.update({ status: "expired" });
      return res.status(400).json({ error: "Invitation expired" });
    }

    // Update user document with contributesTo
    await db.collection("users").doc(userId).update({
      contributesTo: invitation.professionalId,
    });

    // Add user to professional's contributors collection
    await db
      .collection("users")
      .doc(invitation.professionalId)
      .collection("contributors")
      .doc(userId)
      .set({
        name: "", // Will be updated by user profile
        email: invitation.email,
        phone: "",
        roles: invitation.role,
        permissions: invitation.permissions || [],
        addedAt: FieldValue.serverTimestamp(),
      });

    // Mark invitation as accepted
    await invitationDoc.ref.update({
      status: "accepted",
      acceptedAt: FieldValue.serverTimestamp(),
      acceptedBy: userId,
    });

    return res.status(200).json({
      message: "Invitation accepted successfully",
      professionalId: invitation.professionalId,
    });
  } catch (error: any) {
    console.error("Error accepting invitation:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

/**
 * DELETE /users/:userId/invitations/:invitationId
 * Revoke/cancel an invitation
 */
app.delete("/users/:userId/invitations/:invitationId", async (req, res) => {
  try {
    const { userId, invitationId } = req.params;

    const invitationRef = db.collection("invitations").doc(invitationId);
    const invitationDoc = await invitationRef.get();

    if (!invitationDoc.exists) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    const invitation = invitationDoc.data();

    // Verify ownership
    if (invitation?.professionalId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Update status to revoked
    await invitationRef.update({
      status: "revoked",
      revokedAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ message: "Invitation revoked successfully" });
  } catch (error: any) {
    console.error("Error revoking invitation:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /users/:userId/invitations/:invitationId/resend
 * Resend invitation email
 */
app.post("/users/:userId/invitations/:invitationId/resend", async (req, res) => {
  try {
    const { userId, invitationId } = req.params;

    const invitationRef = db.collection("invitations").doc(invitationId);
    const invitationDoc = await invitationRef.get();

    if (!invitationDoc.exists) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    const invitation = invitationDoc.data();

    // Verify ownership
    if (invitation?.professionalId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Can only resend pending invitations
    if (invitation?.status !== "pending") {
      return res.status(400).json({ error: "Can only resend pending invitations" });
    }

    // Get professional data
    const professionalDoc = await db.collection("users").doc(userId).get();
    const professionalData = professionalDoc.data();

    // Send invitation email
    const expiresAt = invitation.expiresAt?.toDate() || new Date();
    const emailSent = await sendInvitationEmail({
      recipientEmail: invitation.email,
      professionalName: professionalData?.name || "Professional",
      role: invitation.role,
      token: invitation.token,
      expiresAt,
    });

    if (!emailSent) {
      return res.status(500).json({ error: "Failed to send email" });
    }

    // Update last sent timestamp
    await invitationRef.update({
      lastSentAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ message: "Invitation resent successfully" });
  } catch (error: any) {
    console.error("Error resending invitation:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


/**
 * ========================================
 * PUBLIC ANAMNESIS FORM ENDPOINTS
 * ========================================
 */

/**
 * GET /public/anamnesis-form/:token
 * Get public form configuration by token (no auth required)
 * Returns professional info, appointment type, and form settings
 */
app.get("/public/anamnesis-form/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // Find token in any user's anamnesisFormTokens collection
    // Since we can't query across subcollections, we need to search through users
    // For better performance in production, consider storing tokens in a global collection
    const usersSnapshot = await db.collection("users").get();

    let tokenData: any = null;
    let professionalId: string | null = null;
    let appointmentType: string | null = null;

    for (const userDoc of usersSnapshot.docs) {
      const onlineTokenDoc = await db
        .doc(`users/${userDoc.id}/anamnesisFormTokens/online`)
        .get();
      const presencialTokenDoc = await db
        .doc(`users/${userDoc.id}/anamnesisFormTokens/presencial`)
        .get();
      const reavaliacaoTokenDoc = await db
        .doc(`users/${userDoc.id}/anamnesisFormTokens/reavaliacao`)
        .get();
      const consultoriaTokenDoc = await db
        .doc(`users/${userDoc.id}/anamnesisFormTokens/consultoria`)
        .get();
      const hibridoTokenDoc = await db
        .doc(`users/${userDoc.id}/anamnesisFormTokens/hibrido`)
        .get();

      if (onlineTokenDoc.exists && onlineTokenDoc.data()?.token === token) {
        tokenData = onlineTokenDoc.data();
        professionalId = userDoc.id;
        appointmentType = "online";
        break;
      }

      if (presencialTokenDoc.exists && presencialTokenDoc.data()?.token === token) {
        tokenData = presencialTokenDoc.data();
        professionalId = userDoc.id;
        appointmentType = "presencial";
        break;
      }

      if (reavaliacaoTokenDoc.exists && reavaliacaoTokenDoc.data()?.token === token) {
        tokenData = reavaliacaoTokenDoc.data();
        professionalId = userDoc.id;
        appointmentType = "reavaliacao";
        break;
      }

      if (consultoriaTokenDoc.exists && consultoriaTokenDoc.data()?.token === token) {
        tokenData = consultoriaTokenDoc.data();
        professionalId = userDoc.id;
        appointmentType = "consultoria";
        break;
      }

      if (hibridoTokenDoc.exists && hibridoTokenDoc.data()?.token === token) {
        tokenData = hibridoTokenDoc.data();
        professionalId = userDoc.id;
        appointmentType = "hibrido";
        break;
      }
    }

    if (!tokenData || !professionalId || !appointmentType) {
      return res.status(404).json({ error: "Token inválido ou não encontrado" });
    }

    // Check if token is active
    if (!tokenData.isActive) {
      return res.status(400).json({ error: "Este formulário não está mais disponível" });
    }

    // Get professional data
    const professionalDoc = await db.doc(`users/${professionalId}`).get();
    const professionalData = professionalDoc.data();

    // Get form settings
    const settingsDoc = await db.doc(`users/${professionalId}/settings/publicForms`).get();
    const settings = settingsDoc.data();

    // Get anamnesis field definitions
    const defaultSettingsDoc = await db.doc(`users/${professionalId}/settings/default`).get();
    const defaultSettings = defaultSettingsDoc.data();
    const customSettingsDoc = await db.doc(`users/${professionalId}/settings/custom`).get();
    const customSettings = customSettingsDoc.data();

    // Get user logo
    const themeDoc = await db.doc(`users/${professionalId}/settings/theme`).get();
    const theme = themeDoc.data();

    const typeSettings = settings?.[appointmentType] || {
      customMessage: "",
      successMessage: "Formulário enviado com sucesso!",
      requireAllFields: true,
    };

    // Get enabled fields from token (not from publicForms settings)
    const enabledFields = tokenData.enabledFields || [];
    const enabledEvaluationFields = tokenData.enabledEvaluationFields || null;

    return res.status(200).json({
      professionalName: theme?.brandName || professionalData?.name || "Profissional",
      logo: theme?.logo?.url || "",
      professionalId,
      appointmentType,
      customMessage: typeSettings.customMessage,
      successMessage: typeSettings.successMessage,
      requireAllFields: typeSettings.requireAllFields,
      enabledFields, // Get from token, not from publicForms settings
      anamnesisFields: { ...defaultSettings?.anamnesis, ...customSettings?.anamnesis },
      enabledEvaluationFields, // Get from token
      enableFeedingHistory: tokenData.enableFeedingHistory ?? false,
      enableAttachments: tokenData.enableAttachments ?? false,
      tokenValid: true,
    });
  } catch (error: any) {
    console.error("Error fetching form configuration:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /public/anamnesis-form/:token/submit
 * Submit public anamnesis form (no auth required)
 */
app.post("/public/anamnesis-form/:token/submit", async (req, res) => {
  try {
    const { token } = req.params;
    const { customerData, anamnesisData, evaluationData, feedingHistory, attachments } = req.body;

    if (!customerData || !anamnesisData) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    // Find token (same logic as GET endpoint)
    const usersSnapshot = await db.collection("users").get();

    let tokenData: any = null;
    let professionalId: string | null = null;
    let appointmentType: string | null = null;

    for (const userDoc of usersSnapshot.docs) {
      const onlineTokenDoc = await db
        .doc(`users/${userDoc.id}/anamnesisFormTokens/online`)
        .get();
      const presencialTokenDoc = await db
        .doc(`users/${userDoc.id}/anamnesisFormTokens/presencial`)
        .get();
      const reavaliacaoTokenDoc = await db
        .doc(`users/${userDoc.id}/anamnesisFormTokens/reavaliacao`)
        .get();
      const consultoriaTokenDoc = await db
        .doc(`users/${userDoc.id}/anamnesisFormTokens/consultoria`)
        .get();
      const hibridoTokenDoc = await db
        .doc(`users/${userDoc.id}/anamnesisFormTokens/hibrido`)
        .get();

      if (onlineTokenDoc.exists && onlineTokenDoc.data()?.token === token) {
        tokenData = onlineTokenDoc.data();
        professionalId = userDoc.id;
        appointmentType = "online";
        break;
      }

      if (presencialTokenDoc.exists && presencialTokenDoc.data()?.token === token) {
        tokenData = presencialTokenDoc.data();
        professionalId = userDoc.id;
        appointmentType = "presencial";
        break;
      }

      if (reavaliacaoTokenDoc.exists && reavaliacaoTokenDoc.data()?.token === token) {
        tokenData = reavaliacaoTokenDoc.data();
        professionalId = userDoc.id;
        appointmentType = "reavaliacao";
        break;
      }

      if (consultoriaTokenDoc.exists && consultoriaTokenDoc.data()?.token === token) {
        tokenData = consultoriaTokenDoc.data();
        professionalId = userDoc.id;
        appointmentType = "consultoria";
        break;
      }

      if (hibridoTokenDoc.exists && hibridoTokenDoc.data()?.token === token) {
        tokenData = hibridoTokenDoc.data();
        professionalId = userDoc.id;
        appointmentType = "hibrido";
        break;
      }
    }

    if (!tokenData || !professionalId || !appointmentType) {
      return res.status(404).json({ error: "Token inválido" });
    }

    if (!tokenData.isActive) {
      return res.status(400).json({ error: "Formulário não disponível" });
    }

    // Get IP and user agent for security tracking
    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    // Convert birthday string to Timestamp (optional — reavaliação forms don't include it)
    const birthdayTimestamp = customerData.birthday
      ? Timestamp.fromDate(new Date(customerData.birthday))
      : null;

    // Prepare submission data (only include ipAddress and userAgent if they exist)
    const submissionData: any = {
      status: "pending",
      appointmentType,
      customerData: {
        ...customerData,
        ...(birthdayTimestamp ? { birthday: birthdayTimestamp } : {}),
      },
      anamnesisData,
      submittedAt: FieldValue.serverTimestamp(),
    };

    // Add evaluation data if provided
    if (evaluationData) {
      submissionData.evaluationData = evaluationData;
    }

    // Add feeding history if provided
    if (feedingHistory && Array.isArray(feedingHistory) && feedingHistory.length > 0) {
      submissionData.feedingHistory = feedingHistory;
    }

    // Add attachments if provided
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      submissionData.attachments = attachments;
    }

    // Only add optional fields if they have values
    if (ipAddress) {
      submissionData.ipAddress = ipAddress.toString();
    }
    if (userAgent) {
      submissionData.userAgent = userAgent.toString();
    }

    // Create submission
    const submissionRef = await db
      .collection(`users/${professionalId}/formSubmissions`)
      .add(submissionData);

    // Update token statistics
    await db.doc(`users/${professionalId}/anamnesisFormTokens/${appointmentType}`).update({
      submissionsCount: FieldValue.increment(1),
      lastSubmissionAt: FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      success: true,
      submissionId: submissionRef.id,
      message: "Formulário enviado com sucesso!",
    });
  } catch (error: any) {
    console.error("Error submitting form:", error);
    return res.status(500).json({ error: "Erro ao enviar formulário" });
  }
});

/**
 * POST /users/:userId/anamnesis-tokens/generate
 * Generate or regenerate anamnesis form token
 */
app.post("/users/:userId/anamnesis-tokens/generate", async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.body;

    if (!type || (type !== "online" && type !== "presencial" && type !== "reavaliacao" && type !== "consultoria" && type !== "hibrido")) {
      return res.status(400).json({ error: "Tipo inválido. Use 'online', 'presencial', 'reavaliacao', 'consultoria' ou 'hibrido'" });
    }

    const token = uuidv4();
    const tokenRef = db.doc(`users/${userId}/anamnesisFormTokens/${type}`);
    const existingToken = await tokenRef.get();

    // Initialize fields from settings if they don't exist or are empty
    let enabledFields = existingToken.data()?.enabledFields;
    let enabledEvaluationFields = existingToken.data()?.enabledEvaluationFields;

    const needsFieldsInit = !enabledFields || enabledFields.length === 0;
    const needsEvalInit = !enabledEvaluationFields;

    // Check if measures is in old format (array of strings instead of objects)
    const needsMeasuresUpdate = enabledEvaluationFields?.measures &&
      Array.isArray(enabledEvaluationFields.measures) &&
      enabledEvaluationFields.measures.length > 0 &&
      typeof enabledEvaluationFields.measures[0] === 'string';

    if (needsFieldsInit || needsEvalInit || needsMeasuresUpdate) {
      // Get all anamnesis field IDs from settings
      if (needsFieldsInit) {
        const defaultSettingsDoc = await db.doc(`users/${userId}/settings/default`).get();
        const anamnesisFields = defaultSettingsDoc.data()?.anamnesis || {};
        enabledFields = Object.keys(anamnesisFields);
      }

      // Get evaluation config and build enabled fields
      if (needsEvalInit || needsMeasuresUpdate) {
        const evaluationSettingsDoc = await db.doc(`users/${userId}/settings/evaluation`).get();
        const evaluationConfig = evaluationSettingsDoc.data();

        const evalConfigKey = (type === "reavaliacao" || type === "consultoria" || type === "hibrido") ? "online" : type;
        if (evaluationConfig && evaluationConfig[evalConfigKey]) {
          const config = evaluationConfig[evalConfigKey];

          if (needsMeasuresUpdate && enabledEvaluationFields) {
            // Update only measures field, keeping other fields
            const availableMeasures = config.fields?.measures?.points || [];
            const oldMeasureIds = enabledEvaluationFields.measures as string[];
            enabledEvaluationFields.measures = availableMeasures.filter((p: any) =>
              p.enabled && oldMeasureIds.includes(p.id)
            );
          } else {
            // Build complete enabledEvaluationFields
            enabledEvaluationFields = {
              weight: config.fields?.weight?.enabled || false,
              height: config.fields?.height?.enabled || false,
              measures: config.fields?.measures?.points?.filter((p: any) => p.enabled) || [],
              photos: config.fields?.photos?.enabled || false,
              folds: false, // Never enable for patients
              bioimpedance: false, // Never enable for patients
            };
          }
        }
      }
    }

    const tokenData = {
      token,
      type,
      professionalId: userId,
      isActive: true,
      enabledFields: enabledFields || [],
      enabledEvaluationFields: enabledEvaluationFields || null,
      ...(existingToken.exists
        ? { regeneratedAt: FieldValue.serverTimestamp() }
        : {
            createdAt: FieldValue.serverTimestamp(),
            submissionsCount: 0,
          }),
    };

    await tokenRef.set(tokenData, { merge: true });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const formUrl = `${frontendUrl}/anamnesis/public/${token}`;

    return res.status(200).json({
      token,
      url: formUrl,
      isActive: true,
      type,
    });
  } catch (error: any) {
    console.error("Error generating token:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * GET /users/:userId/anamnesis-tokens
 * Get both anamnesis tokens and statistics
 */
app.get("/users/:userId/anamnesis-tokens", async (req, res) => {
  try {
    const { userId } = req.params;

    const onlineTokenDoc = await db.doc(`users/${userId}/anamnesisFormTokens/online`).get();
    const presencialTokenDoc = await db.doc(`users/${userId}/anamnesisFormTokens/presencial`).get();
    const reavaliacaoTokenDoc = await db.doc(`users/${userId}/anamnesisFormTokens/reavaliacao`).get();
    const consultoriaTokenDoc = await db.doc(`users/${userId}/anamnesisFormTokens/consultoria`).get();
    const hibridoTokenDoc = await db.doc(`users/${userId}/anamnesisFormTokens/hibrido`).get();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const formatTokenData = (doc: FirebaseFirestore.DocumentSnapshot, type: string) => {
      if (!doc.exists) return null;

      const data = doc.data();
      return {
        token: data?.token,
        type,
        url: data?.token ? `${frontendUrl}/anamnesis/public/${data.token}` : null,
        isActive: data?.isActive || false,
        submissionsCount: data?.submissionsCount || 0,
        enabledFields: data?.enabledFields || [],
        enabledEvaluationFields: data?.enabledEvaluationFields || null,
        enableFeedingHistory: data?.enableFeedingHistory ?? false,
        enableAttachments: data?.enableAttachments ?? false,
        createdAt: data?.createdAt?.toDate().toISOString(),
        regeneratedAt: data?.regeneratedAt?.toDate().toISOString(),
        lastSubmissionAt: data?.lastSubmissionAt?.toDate().toISOString(),
      };
    };

    return res.status(200).json({
      online: formatTokenData(onlineTokenDoc, "online"),
      presencial: formatTokenData(presencialTokenDoc, "presencial"),
      reavaliacao: formatTokenData(reavaliacaoTokenDoc, "reavaliacao"),
      consultoria: formatTokenData(consultoriaTokenDoc, "consultoria"),
      hibrido: formatTokenData(hibridoTokenDoc, "hibrido"),
    });
  } catch (error: any) {
    console.error("Error fetching tokens:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * PUT /users/:userId/anamnesis-tokens/:type/fields
 * Update enabled fields for a specific form type
 */
app.put("/users/:userId/anamnesis-tokens/:type/fields", async (req, res) => {
  try {
    const { userId, type } = req.params;
    const { enabledFields } = req.body;

    if (type !== "online" && type !== "presencial" && type !== "reavaliacao" && type !== "consultoria" && type !== "hibrido") {
      return res.status(400).json({ error: "Tipo inválido. Use 'online', 'presencial', 'reavaliacao', 'consultoria' ou 'hibrido'" });
    }

    if (!Array.isArray(enabledFields)) {
      return res.status(400).json({ error: "enabledFields deve ser um array" });
    }

    const tokenRef = db.doc(`users/${userId}/anamnesisFormTokens/${type}`);
    await tokenRef.set(
      {
        enabledFields,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Error updating enabled fields:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * PUT /users/:userId/anamnesis-tokens/:type/evaluation-fields
 * Update enabled evaluation fields for a specific form type
 */
app.put("/users/:userId/anamnesis-tokens/:type/evaluation-fields", async (req, res) => {
  try {
    const { userId, type } = req.params;
    const { enabledEvaluationFields } = req.body;

    if (type !== "online" && type !== "presencial" && type !== "reavaliacao" && type !== "consultoria" && type !== "hibrido") {
      return res.status(400).json({ error: "Tipo inválido. Use 'online', 'presencial', 'reavaliacao', 'consultoria' ou 'hibrido'" });
    }

    if (!enabledEvaluationFields || typeof enabledEvaluationFields !== "object") {
      return res.status(400).json({ error: "enabledEvaluationFields deve ser um objeto" });
    }

    const tokenRef = db.doc(`users/${userId}/anamnesisFormTokens/${type}`);
    await tokenRef.set(
      {
        enabledEvaluationFields,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Error updating evaluation fields:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * PUT /users/:userId/anamnesis-tokens/:type/feeding-history
 * Toggle the feeding history section for a specific form type
 */
app.put("/users/:userId/anamnesis-tokens/:type/feeding-history", async (req, res) => {
  try {
    const { userId, type } = req.params;
    const { enableFeedingHistory } = req.body;

    if (type !== "online" && type !== "presencial" && type !== "reavaliacao" && type !== "consultoria" && type !== "hibrido") {
      return res.status(400).json({ error: "Tipo inválido. Use 'online', 'presencial', 'reavaliacao', 'consultoria' ou 'hibrido'" });
    }

    if (typeof enableFeedingHistory !== "boolean") {
      return res.status(400).json({ error: "enableFeedingHistory deve ser um booleano" });
    }

    const tokenRef = db.doc(`users/${userId}/anamnesisFormTokens/${type}`);
    await tokenRef.set(
      {
        enableFeedingHistory,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Error updating feeding history setting:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * PUT /users/:userId/anamnesis-tokens/:type/attachments
 * Toggle the extra file attachments section for a specific form type
 */
app.put("/users/:userId/anamnesis-tokens/:type/attachments", async (req, res) => {
  try {
    const { userId, type } = req.params;
    const { enableAttachments } = req.body;

    if (type !== "online" && type !== "presencial" && type !== "reavaliacao" && type !== "consultoria") {
      return res.status(400).json({ error: "Tipo inválido." });
    }
    if (typeof enableAttachments !== "boolean") {
      return res.status(400).json({ error: "enableAttachments deve ser um booleano" });
    }

    await db.doc(`users/${userId}/anamnesisFormTokens/${type}`).set(
      { enableAttachments, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Error updating attachments setting:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Shared processing logic for approve and reprocess endpoints
async function processSubmission(
  userId: string,
  submissionId: string,
  submission: FirebaseFirestore.DocumentData,
  customerData: any,
  anamnesisData: Record<string, any>,
  processedBy: string,
) {
  const evaluationData = submission.evaluationData;
  const feedingHistory = submission.feedingHistory;
  const appointmentType: string = submission.appointmentType || "online";
  const isReavaliacao = appointmentType === "reavaliacao";

  const customersRef = db.collection(`users/${userId}/customers`);
  let customerId: string;
  let existingCustomer = false;
  let birthdayTimestamp: Timestamp | null = null;

  if (isReavaliacao) {
    const phone = customerData?.phone;
    if (!phone) {
      return { status: 400, body: { error: "Telefone é obrigatório para identificar o paciente na reavaliação" } };
    }

    const normalizePhone = (p: string) => p.replace(/\D/g, "").replace(/^55(\d{10,11})$/, "$1");
    const normalizedInput = normalizePhone(phone);
    const withCountryCode = `55${normalizedInput}`;

    const [exactSnap, countryCodeSnap] = await Promise.all([
      customersRef.where("phone", "==", normalizedInput).limit(1).get(),
      customersRef.where("phone", "==", withCountryCode).limit(1).get(),
    ]);

    const cheapMatch = exactSnap.docs[0] ?? countryCodeSnap.docs[0];
    const matchDoc = cheapMatch ?? (await customersRef.get()).docs.find(
      (doc) => normalizePhone(doc.data().phone ?? "") === normalizedInput,
    );

    if (!matchDoc) {
      return {
        status: 404,
        body: {
          error: "Paciente não encontrado",
          message: `Nenhum paciente encontrado com o telefone ${phone}. Verifique se o número está correto.`,
        },
      };
    }

    customerId = matchDoc.id;
    existingCustomer = true;
  } else {
    const userDoc = await db.doc(`users/${userId}`).get();
    const userData = userDoc.data();
    const currentCount = userData?.currentCustomerCount || 0;

    const permanentFree = userData?.permanentFree === true;
    let limit = 50;
    if (permanentFree) {
      limit = 999999;
    } else if (userData?.subscription?.planTier) {
      const planTier = userData.subscription.planTier;
      limit = planTier === "free" ? 50 :
              planTier === "starter" ? 200 :
              planTier === "professional" ? 500 :
              999999;
    }

    if (currentCount >= limit && !permanentFree) {
      return {
        status: 400,
        body: {
          error: "Limite de clientes atingido",
          message: "Você atingiu o limite de clientes do seu plano. Faça upgrade para adicionar mais clientes.",
        },
      };
    }

    const existing = customerData?.cpf
      ? await customersRef.where("cpf", "==", customerData.cpf).limit(1).get()
      : null;

    let existingCustomerId: string | null = null;

    if (existing && !existing.empty) {
      existingCustomerId = existing.docs[0].id;
    } else if (customerData?.email) {
      const emailSnap = await customersRef.where("email", "==", customerData.email).limit(1).get();
      if (!emailSnap.empty) existingCustomerId = emailSnap.docs[0].id;
    }

    if (!existingCustomerId && customerData?.phone) {
      const normalizePhone = (p: string) => p.replace(/\D/g, "").replace(/^55(\d{10,11})$/, "$1");
      const normalizedPhone = normalizePhone(customerData.phone);
      const withCountryCode = `55${normalizedPhone}`;
      const [phoneSnap, phoneCountrySnap] = await Promise.all([
        customersRef.where("phone", "==", normalizedPhone).limit(1).get(),
        customersRef.where("phone", "==", withCountryCode).limit(1).get(),
      ]);
      const phoneMatch = phoneSnap.docs[0] ?? phoneCountrySnap.docs[0];
      if (phoneMatch) existingCustomerId = phoneMatch.id;
    }

    // Normalize birthday to Timestamp — frontend sends "dd/MM/yyyy" after converter roundtrip
    const normalizeBirthday = (raw: any): Timestamp | null => {
      if (!raw) return null;
      if (raw instanceof Timestamp) return raw;
      if (typeof raw === "string") {
        const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
        if (ddmmyyyy) return Timestamp.fromDate(new Date(`${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`));
        const d = new Date(raw);
        if (!isNaN(d.getTime())) return Timestamp.fromDate(d);
      }
      return null;
    };

    const { id: _id, createdAt: _createdAt, name: _name, ...updatableFields } = customerData as any;
    birthdayTimestamp = normalizeBirthday(updatableFields.birthday);
    const normalizedCustomerFields = {
      ...updatableFields,
      ...(birthdayTimestamp !== null ? { birthday: birthdayTimestamp } : {}),
    };

    if (existingCustomerId) {
      customerId = existingCustomerId;
      existingCustomer = true;
      // Update with fields from the form — only overwrite non-empty values so we don't blank out existing data
      const updates: Record<string, any> = {};
      for (const [key, value] of Object.entries(normalizedCustomerFields)) {
        if (value !== undefined && value !== null && value !== "") {
          updates[key] = value;
        }
      }
      if (Object.keys(updates).length > 0) {
        await customersRef.doc(existingCustomerId).update(updates);
      }
    } else {
      const finalName = (appointmentType === "consultoria" || appointmentType === "hibrido") && _name
        ? `${_name} (${appointmentType === "hibrido" ? "Híbrido" : "Consultoria"})`
        : _name;
      const newCustomerRef = await customersRef.add({
        ...normalizedCustomerFields,
        name: finalName,
        ...(birthdayTimestamp === null ? { birthday: null } : {}),
        createdAt: FieldValue.serverTimestamp(),
      });
      customerId = newCustomerRef.id;
    }
  }

  let consultaData = null;
  let consultaId = null;

  const hasFeedingHistory = feedingHistory && Array.isArray(feedingHistory) && feedingHistory.length > 0;
  const hasEvaluationData = evaluationData && Object.keys(evaluationData).length > 0;

  const isOnlineConsulta = appointmentType === "online" || appointmentType === "reavaliacao" || appointmentType === "consultoria";

  const customerAge = birthdayTimestamp
    ? Math.floor((Date.now() - birthdayTimestamp.toDate().getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : undefined;

  if (hasEvaluationData || hasFeedingHistory) {
    consultaData = {
      date: FieldValue.serverTimestamp(),
      ...(isOnlineConsulta && { online: true }),
      ...(customerAge != null && { idade: customerAge }),
      ...(evaluationData?.weight != null && { peso: String(evaluationData.weight) }),
      ...(evaluationData?.height != null && { structure: { altura: Number(evaluationData.height) } }),
      ...(evaluationData?.measures && Object.keys(evaluationData.measures).length > 0 && {
        medidas: Object.fromEntries(
          Object.entries(evaluationData.measures).map(([k, v]) => [
            k.startsWith("circ_") ? k : `circ_${k}`,
            v,
          ])
        ),
      }),
      ...(hasFeedingHistory && { meals: feedingHistory }),
      evaluationProtocol: "patient_submitted",
    };
  }

  const anamnesisRef = await customersRef
    .doc(customerId)
    .collection("anamnesis")
    .add({ ...anamnesisData, createdAt: FieldValue.serverTimestamp() });

  let evaluationDataUpdate: { photos: Record<string, string> } | null = null;

  if (consultaData) {
    const consultaRef = await customersRef
      .doc(customerId)
      .collection("consultas")
      .add({ ...consultaData, anamnesis_id: anamnesisRef.id });
    consultaId = consultaRef.id;

    if (evaluationData?.photos) {
      const bucket = storage.bucket();
      const migratedImages: any = {};
      const positionMap: Record<string, string> = {
        front: "img_frente",
        back: "img_costas",
        side: "img_lado",
      };

      for (const [position, tempUrl] of Object.entries(evaluationData.photos)) {
        if (!tempUrl || typeof tempUrl !== "string") continue;
        const consultaPosition = positionMap[position];
        try {
          const tempPath = decodeURIComponent(tempUrl.split("/o/")[1].split("?")[0]);
          const fileId = uuidv4();
          const newPath = `images/${userId}/${customerId}/${fileId}-${position}`;

          await bucket.file(tempPath).copy(bucket.file(newPath));
          const [newUrl] = await bucket.file(newPath).getSignedUrl({ action: "read", expires: "03-01-2500" });
          migratedImages[consultaPosition] = { path: newPath, url: newUrl };
          await bucket.file(tempPath).delete().catch((err) => {
            console.warn(`Failed to delete temp file ${tempPath}:`, err);
          });
        } catch (error) {
          console.error(`Error migrating photo ${position}:`, error);
        }
      }

      if (Object.keys(migratedImages).length > 0) {
        await consultaRef.update({ images: migratedImages });
      }

      // Build position-keyed map of migrated URLs to update submission photos
      const reversePositionMap: Record<string, string> = {
        img_frente: "front",
        img_costas: "back",
        img_lado: "side",
      };
      const migratedPhotos: Record<string, string> = {};
      for (const [consultaKey, attachment] of Object.entries(migratedImages)) {
        const pos = reversePositionMap[consultaKey];
        if (pos) migratedPhotos[pos] = (attachment as any).url;
      }
      if (Object.keys(migratedPhotos).length > 0) {
        evaluationDataUpdate = { photos: migratedPhotos };
      }
    }
  }

  const submissionRef = db.doc(`users/${userId}/formSubmissions/${submissionId}`);
  const updateData: any = {
    status: "approved",
    processedAt: FieldValue.serverTimestamp(),
    processedBy,
    createdCustomerId: customerId,
  };
  if (consultaId) updateData.createdConsultaId = consultaId;
  if (evaluationDataUpdate) updateData["evaluationData.photos"] = evaluationDataUpdate.photos;
  await submissionRef.update(updateData);

  const responseMessage = existingCustomer
    ? consultaId
      ? "Submissão aprovada: anamnese e consulta adicionadas ao cliente existente"
      : "Submissão aprovada: anamnese adicionada ao cliente existente"
    : consultaId
      ? "Submissão aprovada: cliente, anamnese e consulta criados com sucesso"
      : "Submissão aprovada: cliente e anamnese criados com sucesso";

  return {
    status: 200,
    body: { message: responseMessage, customerId, anamnesisId: anamnesisRef.id, ...(consultaId && { consultaId }) },
  };
}

/**
 * POST /users/:userId/form-submissions/:submissionId/approve
 * Approve form submission and create customer + anamnesis + consulta (if evaluation data exists)
 */
app.post("/users/:userId/form-submissions/:submissionId/approve", async (req, res) => {
  try {
    const { userId, submissionId } = req.params;
    const { customerData, anamnesisData } = req.body;

    const submissionRef = db.doc(`users/${userId}/formSubmissions/${submissionId}`);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return res.status(404).json({ error: "Submissão não encontrada" });
    }

    const submission = submissionDoc.data()!;

    if (submission.status !== "pending") {
      return res.status(400).json({ error: "Submissão já foi processada" });
    }

    // Decrement pending count before processing
    await db.doc(`users/${userId}`).update({
      pendingSubmissionsCount: FieldValue.increment(-1),
    });

    const result = await processSubmission(
      userId, submissionId, submission,
      customerData, anamnesisData,
      (req as any).user?.uid,
    );
    return res.status(result.status).json(result.body);
  } catch (error: any) {
    console.error("Error approving submission:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /users/:userId/form-submissions/:submissionId/reprocess
 * Re-run the approval processing for an already-approved submission.
 * Use when the original approval succeeded but consulta/anamnesis creation failed.
 */
app.post("/users/:userId/form-submissions/:submissionId/reprocess", async (req, res) => {
  try {
    const { userId, submissionId } = req.params;

    const submissionDoc = await db.doc(`users/${userId}/formSubmissions/${submissionId}`).get();

    if (!submissionDoc.exists) {
      return res.status(404).json({ error: "Submissão não encontrada" });
    }

    const submission = submissionDoc.data()!;

    if (submission.status !== "approved") {
      return res.status(400).json({ error: "Apenas submissões já aprovadas podem ser reprocessadas" });
    }

    const result = await processSubmission(
      userId, submissionId, submission,
      submission.customerData, submission.anamnesisData,
      (req as any).user?.uid,
    );
    return res.status(result.status).json(result.body);
  } catch (error: any) {
    console.error("Error reprocessing submission:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /users/:userId/form-submissions/:submissionId/fix-medidas
 * Remaps bare measure keys (abdomen, cintura…) to circ_* in the linked consulta's medidas.
 * Safe to call multiple times — keys already prefixed are left untouched.
 */
app.post("/users/:userId/form-submissions/:submissionId/fix-medidas", async (req, res) => {
  try {
    const { userId, submissionId } = req.params;

    const submissionDoc = await db.doc(`users/${userId}/formSubmissions/${submissionId}`).get();
    if (!submissionDoc.exists) {
      return res.status(404).json({ error: "Submissão não encontrada" });
    }

    const submission = submissionDoc.data()!;
    const { createdCustomerId, createdConsultaId } = submission;

    if (!createdCustomerId || !createdConsultaId) {
      return res.status(400).json({ error: "Submissão não possui consulta vinculada" });
    }

    const consultaRef = db.doc(`users/${userId}/customers/${createdCustomerId}/consultas/${createdConsultaId}`);
    const consultaDoc = await consultaRef.get();
    if (!consultaDoc.exists) {
      return res.status(404).json({ error: "Consulta vinculada não encontrada" });
    }

    const medidas: Record<string, any> = consultaDoc.data()?.medidas || {};
    const needsRemap = Object.keys(medidas).some((k) => !k.startsWith("circ_"));

    if (!needsRemap) {
      return res.status(200).json({ message: "Medidas já estão no formato correto, nenhuma alteração feita" });
    }

    const remapped: Record<string, any> = {};
    for (const [k, v] of Object.entries(medidas)) {
      remapped[k.startsWith("circ_") ? k : `circ_${k}`] = v;
    }

    await consultaRef.update({ medidas: remapped });

    return res.status(200).json({
      message: "Medidas corrigidas com sucesso",
      before: Object.keys(medidas),
      after: Object.keys(remapped),
    });
  } catch (error: any) {
    console.error("Error fixing medidas:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /users/:userId/fix-all-medidas
 * Bulk version: scans all approved form submissions for this user and fixes bare measure keys.
 * Returns a summary of what was changed.
 */
app.post("/users/:userId/fix-all-medidas", async (req, res) => {
  try {
    const { userId } = req.params;

    const submissionsSnap = await db
      .collection(`users/${userId}/formSubmissions`)
      .where("status", "==", "approved")
      .get();

    const results = { fixed: 0, alreadyOk: 0, skipped: 0, errors: [] as string[] };

    for (const submissionDoc of submissionsSnap.docs) {
      const submission = submissionDoc.data();
      const { createdCustomerId, createdConsultaId } = submission;

      if (!createdCustomerId || !createdConsultaId) {
        results.skipped++;
        continue;
      }

      try {
        const consultaRef = db.doc(`users/${userId}/customers/${createdCustomerId}/consultas/${createdConsultaId}`);
        const consultaDoc = await consultaRef.get();

        if (!consultaDoc.exists) {
          results.skipped++;
          continue;
        }

        const medidas: Record<string, any> = consultaDoc.data()?.medidas || {};
        const needsRemap = Object.keys(medidas).some((k) => !k.startsWith("circ_"));

        if (!needsRemap) {
          results.alreadyOk++;
          continue;
        }

        const remapped: Record<string, any> = {};
        for (const [k, v] of Object.entries(medidas)) {
          remapped[k.startsWith("circ_") ? k : `circ_${k}`] = v;
        }

        await consultaRef.update({ medidas: remapped });
        results.fixed++;
      } catch (err: any) {
        results.errors.push(`${submissionDoc.id}: ${err.message}`);
      }
    }

    return res.status(200).json(results);
  } catch (error: any) {
    console.error("Error in bulk fix-all-medidas:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /users/:userId/fix-all-online-flag
 * Sets online = true on consultas linked to approved submissions of type online, reavaliacao, or consultoria.
 * Safe to run multiple times — skips consultas that already have online === true.
 */
app.post("/users/:userId/fix-all-online-flag", async (req, res) => {
  try {
    const { userId } = req.params;
    const onlineTypes = ["online", "reavaliacao", "consultoria"];

    const submissionsSnap = await db
      .collection(`users/${userId}/formSubmissions`)
      .where("status", "==", "approved")
      .get();

    const results = { fixed: 0, alreadyOk: 0, skipped: 0, errors: [] as string[] };

    for (const submissionDoc of submissionsSnap.docs) {
      const submission = submissionDoc.data();
      const { createdCustomerId, createdConsultaId, appointmentType } = submission;

      if (!onlineTypes.includes(appointmentType)) {
        results.skipped++;
        continue;
      }

      if (!createdCustomerId || !createdConsultaId) {
        results.skipped++;
        continue;
      }

      try {
        const consultaRef = db.doc(`users/${userId}/customers/${createdCustomerId}/consultas/${createdConsultaId}`);
        const consultaDoc = await consultaRef.get();

        if (!consultaDoc.exists) {
          results.skipped++;
          continue;
        }

        if (consultaDoc.data()?.online === true) {
          results.alreadyOk++;
          continue;
        }

        await consultaRef.update({ online: true });
        results.fixed++;
      } catch (err: any) {
        results.errors.push(`${submissionDoc.id}: ${err.message}`);
      }
    }

    return res.status(200).json(results);
  } catch (error: any) {
    console.error("Error in fix-all-online-flag:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /users/:userId/form-submissions/:submissionId/reject
 * Reject form submission
 */
app.post("/users/:userId/form-submissions/:submissionId/reject", async (req, res) => {
  try {
    const { userId, submissionId } = req.params;

    const submissionRef = db.doc(`users/${userId}/formSubmissions/${submissionId}`);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return res.status(404).json({ error: "Submissão não encontrada" });
    }

    const submission = submissionDoc.data();

    if (submission?.status !== "pending") {
      return res.status(400).json({ error: "Submissão já foi processada" });
    }

    // Delete temporary photos if they exist
    if (submission?.evaluationData?.photos) {
      const bucket = storage.bucket();

      for (const photoUrl of Object.values(submission.evaluationData.photos)) {
        if (!photoUrl || typeof photoUrl !== "string") continue;

        try {
          const tempPath = decodeURIComponent(photoUrl.split("/o/")[1].split("?")[0]);
          await bucket.file(tempPath).delete();
          console.log(`Deleted temp photo: ${tempPath}`);
        } catch (error) {
          console.error("Error deleting temp photo:", error);
          // Continue even if delete fails (orphaned files cleaned up later)
        }
      }
    }

    await submissionRef.update({
      status: "rejected",
      processedAt: FieldValue.serverTimestamp(),
      processedBy: (req as any).user?.uid,
    });

    // Decrement pending count
    await db.doc(`users/${userId}`).update({
      pendingSubmissionsCount: FieldValue.increment(-1),
    });

    return res.status(200).json({ message: "Submissão rejeitada com sucesso" });
  } catch (error: any) {
    console.error("Error rejecting submission:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * PUT /users/:userId/form-submissions/:submissionId
 * Update pending form submission
 */
app.put("/users/:userId/form-submissions/:submissionId", async (req, res) => {
  try {
    const { userId, submissionId } = req.params;
    const { customerData, anamnesisData } = req.body;

    const submissionRef = db.doc(`users/${userId}/formSubmissions/${submissionId}`);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) {
      return res.status(404).json({ error: "Submissão não encontrada" });
    }

    const submission = submissionDoc.data();

    if (submission?.status !== "pending") {
      return res.status(400).json({ error: "Apenas submissões pendentes podem ser editadas" });
    }

    await submissionRef.update({
      customerData: customerData || submission.customerData,
      anamnesisData: anamnesisData || submission.anamnesisData,
    });

    return res.status(200).json({ message: "Submissão atualizada com sucesso" });
  } catch (error: any) {
    console.error("Error updating submission:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * ============================================================================
 * EVALUATION CONFIGURATION ENDPOINTS
 * ============================================================================
 */

/**
 * GET /users/:userId/evaluation-presets
 * Get available evaluation presets (JP3, JP7, DW4, Bioimpedance)
 */
app.get("/users/:userId/evaluation-presets", async (req, res) => {
  try {
    // Import presets from JSON file
    const presetsModule = await import("./default/evaluationPresets.json", { with: { type: "json" } });
    const presets = presetsModule.default;

    // Transform object to array with IDs
    const presetsArray = Object.entries(presets).map(([id, preset]) => ({
      id,
      ...preset,
    }));

    return res.status(200).json(presetsArray);
  } catch (error: any) {
    console.error("Error fetching evaluation presets:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * GET /users/:userId/evaluation-config
 * Get user's evaluation configuration for online and presencial appointments
 */
app.get("/users/:userId/evaluation-config", async (req, res) => {
  try {
    const { userId } = req.params;

    const settingsDoc = await db.doc(`users/${userId}/settings/evaluation`).get();

    if (!settingsDoc.exists) {
      // Initialize default config if doesn't exist
      const presetsModule = await import("./default/evaluationPresets.json", { with: { type: "json" } });
      const presets = presetsModule.default;

      const defaultConfig = {
        online: {
          enabled: true,
          basePreset: "jp3folds",
          fields: {
            ...presets.jp3folds.fields,
            folds: { enabled: false }, // Never enabled for online
          },
        },
        presencial: {
          enabled: true,
          basePreset: "jp7folds", // Default JP7 for backward compatibility
          fields: presets.jp7folds.fields,
        },
      };

      // Save default config
      await db.doc(`users/${userId}/settings/evaluation`).set(defaultConfig);

      return res.status(200).json(defaultConfig);
    }

    return res.status(200).json(settingsDoc.data());
  } catch (error: any) {
    console.error("Error fetching evaluation config:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * PUT /users/:userId/evaluation-config/:type
 * Update evaluation configuration for specific appointment type (online or presencial)
 */
app.put("/users/:userId/evaluation-config/:type", async (req, res) => {
  try {
    const { userId, type } = req.params;
    const config = req.body;

    if (type !== "online" && type !== "presencial") {
      return res.status(400).json({ error: "Tipo inválido. Use 'online' ou 'presencial'" });
    }

    // Validate that folds are never enabled for online
    if (type === "online" && config.fields?.folds?.enabled) {
      return res.status(400).json({
        error: "Dobras cutâneas não podem ser habilitadas para consultas online",
      });
    }

    const settingsRef = db.doc(`users/${userId}/settings/evaluation`);
    const settingsDoc = await settingsRef.get();

    if (!settingsDoc.exists) {
      // Create new config
      await settingsRef.set({
        [type]: {
          ...config,
          updatedAt: FieldValue.serverTimestamp(),
        },
      });
    } else {
      // Update existing config
      await settingsRef.update({
        [type]: {
          ...config,
          updatedAt: FieldValue.serverTimestamp(),
        },
      });
    }

    return res.status(200).json({ message: "Configuração atualizada com sucesso" });
  } catch (error: any) {
    console.error("Error updating evaluation config:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * 🧮 POST /users/:userId/calculate-body-composition
 * Calculate body composition using anthropometric formulas
 */
app.post("/users/:userId/calculate-body-composition", async (req, res) => {
  try {
    const { gender, age, weight, height, wrist, knee, folds, protocol, densityEquation } = req.body;

    // Validate required fields
    if (!gender || !age || !weight || !folds || !protocol) {
      return res.status(400).json({
        error: "Missing required fields: gender, age, weight, folds, protocol",
      });
    }

    // Validate gender
    if (gender !== "H" && gender !== "M") {
      return res.status(400).json({ error: "Gender must be 'H' or 'M'" });
    }

    // Validate protocol
    if (!["jp3", "jp7", "dw4"].includes(protocol)) {
      return res.status(400).json({ error: "Invalid protocol. Must be jp3, jp7, or dw4" });
    }

    // Calculate body composition
    const results = BodyCompositionService.calculate({
      gender,
      age: Number(age),
      weight: Number(weight),
      height: Number(height),
      wrist: wrist ? Number(wrist) : undefined,
      knee: knee ? Number(knee) : undefined,
      folds,
      protocol,
      densityEquation: densityEquation || "siri",
    });

    return res.status(200).json(results);
  } catch (error: any) {
    console.error("Error calculating body composition:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

/**
 * 🔐 Check custom claims for a user
 * Users can check their own claims, professionals can check any user's claims
 *
 * GET /users/:userId/custom-claims
 */
app.get("/users/:userId/custom-claims", async (req, res) => {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization || "";
    const match = authHeader.match(/^Bearer (.+)$/);

    if (!match) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const idToken = match[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;
    const { userId } = req.params;

    // Check authorization: users can check their own claims, professionals can check anyone's
    if (callerUid !== userId) {
      const callerDoc = await db.doc(`users/${callerUid}`).get();
      const callerData = callerDoc.data();

      if (!callerData || !isProfessionalRole(callerData.roles?.ability)) {
        return res.status(403).json({
          error: "Access denied: You can only check your own claims unless you're a professional"
        });
      }
    }

    // Get user's custom claims from Firebase Auth
    const userRecord = await auth.getUser(userId);

    return res.status(200).json({
      userId: userId,
      customClaims: userRecord.customClaims || {},
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
    });
  } catch (error: any) {
    console.error("Error fetching custom claims:", error);

    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: "User not found with provided UID" });
    }

    return res.status(500).json({
      error: "Failed to fetch custom claims",
      details: error.message
    });
  }
});

/**
 * 🔐 ADMIN ONLY: Initialize or update default settings in /settings/professional
 * This writes anamnesis fields, evaluation config, and evaluation presets
 * to the global settings collection that will be used as template for new users.
 *
 * Requires: PROFESSIONAL role (admin check)
 * POST /admin/initialize-default-settings
 */
app.post("/admin/initialize-default-settings", async (req, res) => {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization || "";
    const match = authHeader.match(/^Bearer (.+)$/);

    if (!match) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const idToken = match[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const callerUid = decodedToken.uid;

    // Verify caller is a professional (admin)
    const callerDoc = await db.doc(`users/${callerUid}`).get();
    const callerData = callerDoc.data();

    if (!callerData || !isProfessionalRole(callerData.roles?.ability)) {
      return res.status(403).json({
        error: "Access denied: Only professionals can initialize default settings"
      });
    }

    // Import settings from JSON files
    const anamnesisFieldsModule = await import("./default/anamnesisFields.json", { with: { type: "json" } });
    const evaluationPresetsModule = await import("./default/evaluationPresets.json", { with: { type: "json" } });

    const anamnesisFields = anamnesisFieldsModule.default;
    const evaluationPresets = evaluationPresetsModule.default;

    // Prepare default evaluation config for both appointment types
    const defaultEvaluationConfig = {
      presencial: {
        enabled: true,
        basePreset: "jp7folds",
        fields: evaluationPresets.jp7folds.fields,
      },
      online: {
        enabled: true,
        basePreset: null,
        fields: {
          weight: { enabled: true, label: "Peso", required: true },
          height: { enabled: true, label: "Altura", required: true },
          photos: { enabled: true, label: "Fotos", positions: ["front", "back", "side"] },
          measures: { enabled: true, points: evaluationPresets.jp7folds.fields.measures.points },
          folds: { enabled: false, points: [] }, // Disabled for online
          bioimpedance: { enabled: false },
        },
      },
    };

    // Prepare professional settings with anamnesis and evaluation
    const professionalSettings = {
      anamnesis: anamnesisFields.anamnesis,
      evaluation: defaultEvaluationConfig,
      evaluationPresets: evaluationPresets,
    };

    // Write to Firestore
    const settingsRef = db.collection("settings");
    const professionalRef = settingsRef.doc("professional");
    const contributorRef = settingsRef.doc("contributor");

    await professionalRef.set(professionalSettings);
    await contributorRef.set({});

    console.log("Default settings initialized successfully by", callerUid);

    return res.status(200).json({
      success: true,
      message: "Default settings (anamnesis + evaluation) successfully written",
      details: {
        anamnesisFieldsCount: Object.keys(anamnesisFields.anamnesis || {}).length,
        evaluationPresetsCount: Object.keys(evaluationPresets || {}).length,
        initializedBy: callerUid,
      }
    });
  } catch (error: any) {
    console.error("Error initializing default settings:", error);
    return res.status(500).json({
      error: "Failed to initialize default settings",
      details: error.message
    });
  }
});

// TEMPORARY: one-shot backfill — remove after running
// POST /users/:userId/backfill-last-consulta-date
app.post("/users/:userId/backfill-last-consulta-date", async (req, res) => {
  try {
    const { userId } = req.params;
    const customersRef = db.collection(`/users/${userId}/customers`);
    const allSnap = await customersRef.get();

    const targets = allSnap.docs.filter((doc) => {
      const data = doc.data();
      return (
        typeof data.name === "string" &&
        data.name.toLowerCase().includes("consultoria") &&
        (data.lastConsultaDate === undefined || data.lastConsultaDate === null)
      );
    });

    let updated = 0;
    let skipped = 0;

    for (const customerDoc of targets) {
      const consultasRef = customersRef.doc(customerDoc.id).collection("consultas");
      const latestSnap = await consultasRef.orderBy("date", "desc").limit(1).get();

      if (latestSnap.empty) {
        skipped++;
        continue;
      }

      await customersRef.doc(customerDoc.id).update({
        lastConsultaDate: latestSnap.docs[0].data().date,
      });
      updated++;
    }

    return res.status(200).json({ total: targets.length, updated, skipped });
  } catch (error: any) {
    console.error("backfill error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// ── CRM: Leads ──────────────────────────────────────────────────────────────

// GET /users/:userId/leads
app.get("/users/:userId/leads", async (req, res) => {
  try {
    const { userId } = req.params;
    const snap = await db
      .collection(`users/${userId}/leads`)
      .orderBy("createdAt", "desc")
      .get();
    const leads = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(leads);
  } catch (error: any) {
    console.error("Error fetching leads:", error);
    return res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// POST /users/:userId/leads
app.post("/users/:userId/leads", async (req, res) => {
  try {
    const { userId } = req.params;
    const now = FieldValue.serverTimestamp();
    const ref = await db.collection(`users/${userId}/leads`).add({
      ...req.body,
      tags: req.body.tags ?? [],
      isConverted: false,
      createdAt: now,
      updatedAt: now,
    });
    return res.status(201).json({ id: ref.id });
  } catch (error: any) {
    console.error("Error creating lead:", error);
    return res.status(500).json({ error: "Failed to create lead" });
  }
});

// PATCH /users/:userId/leads/:leadId
app.patch("/users/:userId/leads/:leadId", async (req, res) => {
  try {
    const { userId, leadId } = req.params;
    const { id: _id, createdAt: _createdAt, ...updates } = req.body;
    await db.doc(`users/${userId}/leads/${leadId}`).update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error("Error updating lead:", error);
    return res.status(500).json({ error: "Failed to update lead" });
  }
});

// POST /users/:userId/leads/:leadId/convert
app.post("/users/:userId/leads/:leadId/convert", async (req, res) => {
  try {
    const { userId, leadId } = req.params;

    const leadDoc = await db.doc(`users/${userId}/leads/${leadId}`).get();
    if (!leadDoc.exists) {
      return res.status(404).json({ error: "Lead not found" });
    }
    const lead = leadDoc.data()!;

    if (lead.isConverted) {
      return res.status(400).json({ error: "Lead already converted" });
    }

    const now = FieldValue.serverTimestamp();
    const batch = db.batch();

    // Create customer
    const customerRef = db.collection(`users/${userId}/customers`).doc();
    batch.set(customerRef, {
      name: lead.name ?? "",
      phone: lead.phone ?? "",
      email: lead.email ?? "",
      cameBy: `CRM - ${lead.source ?? ""}`,
      createdAt: now,
    });

    // Mark lead as converted
    batch.update(db.doc(`users/${userId}/leads/${leadId}`), {
      isConverted: true,
      convertedAt: now,
      convertedToCustomerId: customerRef.id,
      stage: "convertido",
      updatedAt: now,
    });

    await batch.commit();

    return res.status(200).json({ customerId: customerRef.id });
  } catch (error: any) {
    console.error("Error converting lead:", error);
    return res.status(500).json({ error: "Failed to convert lead" });
  }
});

// GET /users/:userId/chatwoot/verify
app.get("/users/:userId/chatwoot/verify", async (req, res) => {
  try {
    const { userId } = req.params;
    const snap = await db.doc(`users/${userId}/settings/crm`).get();
    const settings = snap.data();

    if (!settings?.chatwootApiUrl || !settings?.chatwootApiToken || !settings?.chatwootAccountId) {
      return res.status(200).json({ ok: false, reason: "Integration not configured" });
    }

    // Ping the Chatwoot API
    const baseUrl = `${settings.chatwootApiUrl.replace(/\/$/, "")}/api/v1/accounts/${settings.chatwootAccountId}`;
    const response = await fetch(`${baseUrl}/conversations?page=1`, {
      headers: { api_access_token: settings.chatwootApiToken },
    });

    return res.status(200).json({ ok: response.ok });
  } catch (error: any) {
    console.error("Error verifying Chatwoot:", error);
    return res.status(200).json({ ok: false, reason: error.message });
  }
});

// GET /users/:userId/chatwoot/debug-phone?phone=51995550882
// Returns raw Chatwoot filter results for both E.164 variants of a phone number.
app.get("/users/:userId/chatwoot/debug-phone", async (req, res) => {
  try {
    const { userId } = req.params;
    const phone = req.query.phone as string;
    if (!phone) return res.status(400).json({ error: "phone param required" });

    const snap = await db.doc(`users/${userId}/settings/crm`).get();
    const settings = snap.data();
    if (!settings?.chatwootApiUrl || !settings?.chatwootApiToken || !settings?.chatwootAccountId) {
      return res.status(400).json({ error: "Chatwoot not configured" });
    }

    const { ChatwootService } = await import("./services/ChatwootService.js");
    const chatwoot = new ChatwootService({
      apiUrl: settings.chatwootApiUrl,
      apiToken: settings.chatwootApiToken,
      accountId: settings.chatwootAccountId,
    });

    const digits = phone.replace(/\D/g, "");
    let e164: string | undefined;
    if (digits.startsWith("55") && digits.length >= 12) {
      e164 = `+${digits}`;
    } else if (digits.length === 10 || digits.length === 11) {
      e164 = `+55${digits}`;
    }

    if (!e164) return res.status(400).json({ error: "Could not normalize phone to E.164" });

    const variants: string[] = [e164];
    if (e164.length === 14) variants.push(`${e164.slice(0, 5)}${e164.slice(6)}`);
    else if (e164.length === 13) variants.push(`${e164.slice(0, 5)}9${e164.slice(5)}`);

    const results: Record<string, unknown> = { e164, variants };
    for (const v of variants) {
      const found = await (chatwoot as any).filterByPhone(v);
      results[v] = found;
    }

    return res.status(200).json(results);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Wrap app so it handles both:
//   /users/...        — local dev (Vite proxy strips /api prefix)
//   /api/users/...    — production (Firebase Hosting forwards full path)
const root = express();
root.use(cors({ origin: true }));
root.use("/api", app);
root.use("/", app);

// Export the Express app as an HTTPS Cloud Function (v2 with secrets)
export const api = onRequest(
  { secrets: ["EMAIL_USER", "EMAIL_PASSWORD"] },
  root
);