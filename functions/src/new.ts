import * as functions from "firebase-functions";
import { onRequest, onCall } from "firebase-functions/v2/https";
import {
  onDocumentCreated,
  onDocumentUpdated,
  // FirestoreEvent,
  // onDocumentUpdatedWithAuthContext,
  // onDocumentWritten,
  // onDocumentUpdated,
  // onDocumentDeleted,
  // Change,
} from "firebase-functions/v2/firestore";
import { FieldValue } from "firebase-admin/firestore";

// getFirestore and getAuth are needed as functions for some calls
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Ensure Firebase Admin is initialized
import "./firebase-admin.js";

// Import JSON file with modern syntax
import anamnesisFields from "./default/anamnesisFields.json" with { type: "json" };

export type abilities = "PROFESSIONAL" | "COLLABORATOR" | "CUSTOMER";
export interface IUser {
  id?: string;
  name?: string;
  email?: string;
  emailVerified?: boolean;
  phone?: string;
  createdAt?: string;
  roles?: {
    ability: abilities;
  };
  contributesTo?: string;
  contributors?: string[];
}

// Create a user on firebsase authentication from a client-side function call
export const createAuthUser = onCall(async (request) => {
  const user: IUser = request.data;
  // Check whether the user already exists. If so, update it, otherwise, create a new one.
  return getAuth()
    .getUserByEmail(user.email!)
    .then(async (userExists) => {
      try {
        const updateResult = await getAuth().updateUser(userExists.uid, user);
        functions.logger.info(
          "AUTH: Successfully updated user:'",
          updateResult.uid,
        );
        return userExists.uid;
      } catch (updateError) {
        const { code } = JSON.parse(JSON.stringify(updateError));

        functions.logger.error(
          "AUTH: Error updating existent user: ",
          updateError,
        );
        throw new functions.https.HttpsError(code, "Error updating user");
      }
    })
    .catch(async (reason: unknown) => {
      const { code } = JSON.parse(JSON.stringify(reason));
      // user-not-found is expected. If another error occur, throw it to the client
      if (code != "auth/user-not-found") {
        functions.logger.error("AUTH: Error getting existent user: ", reason);
        throw new functions.https.HttpsError(
          code,
          "Error getting existent user",
        );
      }
      // Create new user
      try {
        const result = await getAuth().createUser({
          email: user.email,
          emailVerified: false,
          password: user.email,
          displayName: user.name,
          phoneNumber: user.phone,
          disabled: false,
        });
        functions.logger.info(
          "AUTH: Successfully created new user:'",
          result.uid,
        );
        return result.uid;
      } catch (error) {
        const { code: code_1 } = JSON.parse(JSON.stringify(error));
        functions.logger.error("==== ERROR CREATING USER === ", code_1);
        throw new functions.https.HttpsError(code_1, "Error creating new user");
      }
    });
});

// define user custom claims and load default config when document /users/{uid} were created
export const onCreateFirestoreUserSetCustomClaims = onDocumentCreated(
  "users/{userId}",
  async (event) => {
    const userId = event.params.userId;
    const snapshot = event.data;
    if (!snapshot) {
      functions.logger.info("No data associated with the event");
      return;
    }
    const user: IUser = snapshot.data();
    const isAdmin = user.roles?.ability === "PROFESSIONAL";

    try {
      await getAuth().setCustomUserClaims(userId, {
        admin: isAdmin,
        role: user.roles?.ability,
        contributesTo: user.contributesTo,
      });
    } catch (err) {
      functions.logger.error(
        "Error updating  custom user claims for " + userId,
        err,
      );
      throw err;
    }

    return;
  },
);

export const onCreateFirestoreUserLoadDefaultSettings = onDocumentCreated(
  "users/{userId}",
  (event) => {
    const userId = event.params.userId;
    const db = getFirestore();
    const snapshot = event.data;
    if (!snapshot) {
      functions.logger.info("No data associated with the event");
      return;
    }
    const user: IUser = snapshot.data();
    const isAdmin = user.roles?.ability === "PROFESSIONAL";

    const userDefaultSettingsRef = db.doc(
      "/users/" + userId + "/settings/default",
    );
    const userCustomSettingsRef = db.doc(
      "/users/" + userId + "/settings/custom",
    );
    const settingsRef = isAdmin
      ? db.doc("/settings/professional")
      : db.doc("/settings/contributor");

    try {
      // load default settings to user firestore db
      db.runTransaction(async (t) => {
        const settingsDoc = await t.get(settingsRef);
        const defaultSettings = settingsDoc.data();

        t.create(userDefaultSettingsRef, defaultSettings);
        t.create(userCustomSettingsRef, {});
      });
      functions.logger.info("Default settings loaded to user " + userId);
    } catch (err) {
      functions.logger.error(
        "Default settings couldn't be loaded to user " + userId,
      );
    }

    return;
  },
);

// redefine user custom claims when document /users/{uid} were updated
export const onUpdateFirestoreUser = onDocumentUpdated(
  "users/{userId}",
  async (event) => {
    const userId = event.params.userId;
    const snapshot = event.data;
    if (!snapshot) {
      functions.logger.info("No data associated with the event");
      return;
    }
    const user: IUser = snapshot.after.data();
    const contributors = user.contributors && Object.keys(user.contributors);

    console.log(user);
    try {
      await getAuth().setCustomUserClaims(userId, {
        admin: user.roles?.ability === "PROFESSIONAL",
        role: user.roles?.ability,
        contributesTo: user.contributesTo,
        contributors,
      });
    } catch (err) {
      functions.logger.error(
        "Error updating  custom user claims for " + userId,
        err,
      );
      throw err;
    }
    return;
  },
);

/* Commit default settings contained in JSON files located at "default" folder to 
   Firestore root collection "settings", which I'll be loaded to User's DB on account created */
export const setDefaultSettingsOnFirestore = onRequest(
  async (request, response) => {
    // const uid = request.auth?.uid;
    // create default settings document
    const settingsRef = getFirestore().collection("/settings");
    const professionalRef = settingsRef.doc("professional");
    const contributorRef = settingsRef.doc("contributor");
    try {
      const result = await professionalRef.set(anamnesisFields);
      await contributorRef.set({});
      response.send(
        "Anamnesis Collection successfully written.\n" + JSON.stringify(result),
      );
    } catch (err) {
      functions.logger.error(
        "Couldn't write anamnesis collection to DB. \n",
        err,
      );
      response
        .status(404)
        .send(
          "Couldnt write anamnesis collection to DB \n" + JSON.stringify(err),
        );
    }
  },
);

/**
 * Inicializa configurações para usuários existentes que não possuem configurações
 * Útil para migrar usuários existentes ou corrigir usuários importados da produção
 *
 * Pode ser chamado por:
 * - O próprio usuário (inicializa suas próprias configurações)
 * - Um administrador (pode inicializar configurações para qualquer usuário passando targetUserId)
 */
export const initializeUserSettings = onCall(async (request) => {
  const callerId = request.auth?.uid;
  const targetUserId = request.data?.userId || callerId;
  const db = getFirestore();

  if (!callerId) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Usuário deve estar autenticado"
    );
  }

  // Se estiver inicializando configurações de outro usuário, o chamador deve ser admin
  if (targetUserId !== callerId) {
    const callerDoc = await db.doc(`/users/${callerId}`).get();
    const callerData = callerDoc.data() as IUser;

    if (callerData?.roles?.ability !== "PROFESSIONAL") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Apenas profissionais podem inicializar configurações para outros usuários"
      );
    }
  }

  try {
    // Buscar documento do usuário alvo
    const userRef = db.doc(`/users/${targetUserId}`);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        `Usuário ${targetUserId} não encontrado`
      );
    }

    const user = userDoc.data() as IUser;
    const isProfessional = user.roles?.ability === "PROFESSIONAL";

    // Determinar quais configurações padrão carregar
    const settingsPath = isProfessional ? "professional" : "contributor";
    const settingsRef = db.doc(`/settings/${settingsPath}`);
    const settingsDoc = await settingsRef.get();

    if (!settingsDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        `Configurações padrão não encontradas em /settings/${settingsPath}`
      );
    }

    const defaultSettings = settingsDoc.data();

    // Verificar se o usuário já possui configurações
    const userDefaultSettingsRef = db.doc(`/users/${targetUserId}/settings/default`);
    const userCustomSettingsRef = db.doc(`/users/${targetUserId}/settings/custom`);

    const existingDefaultSettings = await userDefaultSettingsRef.get();
    const existingCustomSettings = await userCustomSettingsRef.get();

    // Usar transação para criar/atualizar configurações atomicamente
    await db.runTransaction(async (t) => {
      if (!existingDefaultSettings.exists) {
        t.set(userDefaultSettingsRef, defaultSettings || {});
        functions.logger.info(`Configurações padrão criadas para usuário ${targetUserId}`);
      } else {
        t.update(userDefaultSettingsRef, defaultSettings || {});
        functions.logger.info(`Configurações padrão atualizadas para usuário ${targetUserId}`);
      }

      if (!existingCustomSettings.exists) {
        t.set(userCustomSettingsRef, {});
        functions.logger.info(`Configurações personalizadas criadas para usuário ${targetUserId}`);
      }
    });

    return {
      success: true,
      userId: targetUserId,
      role: user.roles?.ability,
      settingsType: settingsPath,
      fieldsCount: defaultSettings?.anamnesis ? Object.keys(defaultSettings.anamnesis).length : 0,
      created: !existingDefaultSettings.exists
    };
  } catch (err: any) {
    functions.logger.error(
      `Erro ao inicializar configurações para usuário ${targetUserId}:`,
      err
    );
    if (err instanceof functions.https.HttpsError) {
      throw err;
    }
    throw new functions.https.HttpsError(
      "internal",
      `Falha ao inicializar configurações: ${err.message}`
    );
  }
});

export const redefineCustomClaims = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) return;
  const usersRef = getFirestore().collection("/users");
  const userRef = usersRef.doc(userId);

  const user: IUser = await userRef.get();

  if (!user) {
    functions.logger.info("No user associated with the request");
    return;
  }
  const contributors = user.contributors && Object.keys(user.contributors);

  console.log(user);
  try {
    const isAdmin = user.roles?.ability === "PROFESSIONAL";
    await getAuth().setCustomUserClaims(userId, {
      admin: isAdmin,
      role: user.roles?.ability,
      contributesTo: user.contributesTo,
      contributors,
    });
    return {
      admin: isAdmin
    };
  } catch (err) {
    functions.logger.error(
      "Error redefining custom user claims for " + userId,
      err,
    );
    throw err;
  }
});

//call http request with ?id={user uid} to check the user custom claims
export const checkCustomClaims = onRequest(async (request, response) => {
  const id = request.query.id;
  if (!id) return;

  try {
    const userRecord = await getAuth().getUser(id as string);
    response.send("Custom Claims: " + JSON.stringify(userRecord.customClaims));
  } catch (err) {
    functions.logger.warn("No user found with the UID provided", {
      structuredData: true,
    });
    functions.logger.error(err, { structuredData: true });
    response.status(404).send("No user FOUND with provided UID");
  }
  return;
});

// exports.sendWelcomeEmail = functions.auth.user().onCreate((user) => {
//   // ...
// });

/**
 * Trigger whenever a document is created, updated, or deleted
 * inside customers/{customerId}/consultas/{consultaId}.
 */
export const updateLastConsultaDate = onDocumentUpdated(
  "users/{userId}/customers/{customerId}/consultas/{consultaId}",
  async (event) => {
    const { userId, customerId } = event.params;
    // const snapshot = event.data; // Not used in this function
    const db = getFirestore();

    const customerRef = db.collection("/users/" + userId + "/customers").doc(customerId);
    const consultasRef = customerRef.collection('consultas');

    try {
      // Find most recent appointment
      const latestSnap = await consultasRef
        .orderBy('date', 'desc')
        .limit(1)
        .get();

      let latestDate: FirebaseFirestore.Timestamp | null = null;

      if (!latestSnap.empty) {
        const latest = latestSnap.docs[0].data();
        latestDate = latest.date as FirebaseFirestore.Timestamp;
      }

      // Update the customer's lastConsultaDate
      await customerRef.update({
        lastConsultaDate:
          latestDate ?? FieldValue.delete(),
      });

      functions.logger.info(
        `Updated lastConsultaDate for customer ${customerId}`
      );
    } catch (error) {
      functions.logger.error(
        `Failed to update lastConsultaDate for ${customerId}`,
        error
      );
    }
  }
);


