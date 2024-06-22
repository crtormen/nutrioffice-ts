import * as functions from "firebase-functions";
import { onRequest, onCall } from "firebase-functions/v2/https";
import * as anamnesisFields from "./default/anamnesisFields.json";
import {
  onDocumentCreated,
  onDocumentUpdated,
  // onDocumentUpdatedWithAuthContext,
  // onDocumentWritten,
  // onDocumentUpdated,
  // onDocumentDeleted,
  // Change,
  // FirestoreEvent,
} from "firebase-functions/v2/firestore";
import { getFirestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

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
  // Check whether the user already exists, if so, update it, otherwise, create a new one.
  return admin
    .auth()
    .getUserByEmail(user.email!)
    .then(async (userExists) => {
      try {
        const updateResult = await admin
          .auth()
          .updateUser(userExists.uid, user);
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
        throw new functions.auth.HttpsError(code, "Error updating user");
      }
    })
    .catch(async (reason: unknown) => {
      const { code } = JSON.parse(JSON.stringify(reason));
      // user-not-found is expected. If another error occur, throw it to the client
      if (code != "auth/user-not-found") {
        functions.logger.error("AUTH: Error getting existent user: ", reason);
        throw new functions.auth.HttpsError(
          code,
          "Error getting existent user",
        );
      }
      // Create new user
      try {
        const result = await admin.auth().createUser({
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
        throw new functions.auth.HttpsError(code_1, "Error creating new user");
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
      await admin.auth().setCustomUserClaims(userId, {
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

    const userSettingsRef = db.doc("/users/" + userId + "/settings/default");
    const settingsRef = isAdmin
      ? db.doc("/settings/professional")
      : db.doc("/settings/contributor");

    try {
      // load default settings to user firestore db
      db.runTransaction(async (t) => {
        const settingsDoc = await t.get(settingsRef);
        const defaultSettings = settingsDoc.data();

        t.create(userSettingsRef, defaultSettings);
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
      await admin.auth().setCustomUserClaims(userId, {
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
    try {
      const result = await professionalRef.set(anamnesisFields);
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

export const reloadDefaultSettingsToUser = onCall(async (request) => {
  const userId = request.auth?.uid;
  const db = getFirestore();
  const settingsRef = getFirestore().collection("/settings");
  const professionalRef = settingsRef.doc("professional");

  const userSettingsRef = db.doc("/users/" + userId + "/settings/default");

  try {
    // load default settings to user firestore db
    db.runTransaction(async (t) => {
      const settingsDoc = await t.get(professionalRef);
      const defaultSettings = settingsDoc.data();

      t.set(userSettingsRef, defaultSettings);
    });
    functions.logger.info("Default settings loaded to user " + userId);
    return true;
  } catch (err) {
    functions.logger.error(
      "Default settings couldn't be loaded to user " + userId,
    );
    throw err;
  }
});

//call http request with ?id={user uid} to check the user custom claims
export const checkCustomClaims = onRequest(async (request, response) => {
  const id = request.query.id;
  if (!id) return;

  try {
    const userRecord = await admin.auth().getUser(id as string);
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
