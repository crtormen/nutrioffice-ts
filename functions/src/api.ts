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


// Export the Express app as an HTTPS Cloud Function
export const api = functions.https.onRequest(app);