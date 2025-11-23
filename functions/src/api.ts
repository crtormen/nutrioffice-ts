import functions from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";
import express from "express";
import cors from "cors";

import { db, auth } from "./firebase-admin.js";

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

app.post("/users/:userId/customer-anamnesis", async (req, res) => {
  try {
    const { userId } = req.params;    
    const customersRef = db.collection("/users/" + userId + "/customers");
    const { cpf, customerData, anamnesisData } = req.body;
 
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

    return res.status(201).json({
      message: "Anamnesis created successfully",
      customerId,
      anamnesisId: anamnesisRef.id,
    });
  } catch (error) {
    console.error("Error in /create-customer:", error);
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

// Export the Express app as an HTTPS Cloud Function
export const api = functions.https.onRequest(app);