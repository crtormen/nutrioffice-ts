import {
  DocumentData,
  orderBy,
  PartialWithFieldValue,
  query,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";

import { IFormSubmission, IFormSubmissionFirebase } from "@/domain/entities/formSubmission";
import { ICustomer, ICustomerFirebase } from "@/domain/entities";
import { dateInString } from "@/lib/utils";
import { createCollectionRef, DatabaseService } from "./DatabaseService";
import { auth } from "@/infra/firebase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/nutri-office/us-central1/api";

const FormSubmissionsCollection = (uid: string) => {
  return uid
    ? createCollectionRef<IFormSubmissionFirebase>("users/" + uid + "/formSubmissions")
    : null;
};

/**
 * Helper to get auth token
 */
const getAuthToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }
  return await user.getIdToken();
};

export const FormSubmissionsService = (uid: string | undefined) => {
  if (!uid) return null;
  const collection = FormSubmissionsCollection(uid);
  if (!collection) return null;

  const submissionService = new DatabaseService<IFormSubmissionFirebase>(collection);

  submissionService.query = query(
    collection.withConverter({
      toFirestore({ ...data }: PartialWithFieldValue<IFormSubmission>): DocumentData {
        return data;
      },
      fromFirestore(
        snapshot: QueryDocumentSnapshot<IFormSubmissionFirebase>,
        options: SnapshotOptions,
      ): IFormSubmission {
        const data = snapshot.data(options);

        // Convert customer data timestamps
        const customerData: ICustomer = {
          id: "",
          ...data.customerData,
          birthday: dateInString(data.customerData.birthday),
          createdAt: "", // Will be set when approved
        };

        return {
          id: snapshot.id,
          status: data.status,
          appointmentType: data.appointmentType,
          customerData,
          anamnesisData: data.anamnesisData,
          evaluationData: data.evaluationData,
          submittedAt: dateInString(data.submittedAt),
          processedAt: data.processedAt ? dateInString(data.processedAt) : undefined,
          processedBy: data.processedBy,
          createdCustomerId: data.createdCustomerId,
          createdConsultaId: data.createdConsultaId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        };
      },
    }),
    orderBy("submittedAt", "desc"),
  );

  /**
   * Approve submission and create customer + anamnesis
   */
  const approve = async (submissionId: string, data: {
    customerData: ICustomerFirebase;
    anamnesisData: Record<string, string | string[]>;
  }) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/users/${uid}/form-submissions/${submissionId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Falha ao aprovar submissão");
      }

      return response.json();
    } catch (error) {
      console.error("Error approving submission:", error);
      throw error;
    }
  };

  /**
   * Reject submission
   */
  const reject = async (submissionId: string) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/users/${uid}/form-submissions/${submissionId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Falha ao rejeitar submissão");
      }

      return response.json();
    } catch (error) {
      console.error("Error rejecting submission:", error);
      throw error;
    }
  };

  /**
   * Update pending submission
   */
  const update = async (submissionId: string, data: {
    customerData?: ICustomerFirebase;
    anamnesisData?: Record<string, string | string[]>;
  }) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/users/${uid}/form-submissions/${submissionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Falha ao atualizar submissão");
      }

      return response.json();
    } catch (error) {
      console.error("Error updating submission:", error);
      throw error;
    }
  };

  return {
    getAll: submissionService.getAll.bind(submissionService),
    getAllOnce: submissionService.getAllOnce.bind(submissionService),
    addOne: submissionService.addOne.bind(submissionService),
    setOne: submissionService.setOne.bind(submissionService),
    deleteOne: submissionService.deleteOne.bind(submissionService),
    updateOne: submissionService.updateOne.bind(submissionService),
    getOne: submissionService.getOne.bind(submissionService),
    approve,
    reject,
    update,
  };
};
