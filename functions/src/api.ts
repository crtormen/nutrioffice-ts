import functions from "firebase-functions";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

import { db, auth } from "./firebase-admin.js";
import { sendInvitationEmail } from "./services/emailService.js";

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
    functions.logger.error('Error getting inactive customers:', error);
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
    if (professionalRole !== "PROFESSIONAL") {
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
      functions.logger.warn(`Invitation created but email failed to send: ${invitationRef.id}`);
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

    let query = db
      .collection("invitations")
      .where("professionalId", "==", userId)
      .orderBy("createdAt", "desc");

    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.get();

    const invitations = snapshot.docs.map((doc) => {
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


// Export the Express app as an HTTPS Cloud Function
export const api = functions.https.onRequest(app);