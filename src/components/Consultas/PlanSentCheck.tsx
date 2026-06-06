import type { ICustomerConsulta } from "@/domain/entities"
import { Button } from "../ui/button";
import { CircleCheckBig, Upload } from "lucide-react";
import { useUpdateCustomerConsultaMutation } from "@/app/state/features/customerConsultasSlice";
import { useAuth } from "@/infra/firebase";
import { useParams } from "react-router-dom";


interface PlanSentCheckProps {
  consulta: ICustomerConsulta;
}

export const PlanSentCheck: React.FC<PlanSentCheckProps> = ({
  consulta,
}) => {
  const [updateConsulta, { isLoading }] = useUpdateCustomerConsultaMutation();
  const { dbUid } = useAuth();
  const { customerId } = useParams<{ customerId: string }>();

  const checkPlanSending = async () => {
    try {
      await updateConsulta({
        uid: dbUid,
        customerId: customerId,
        consulta: {
          ...consulta,
          planId: Date.now().toString()
        }
      }).unwrap();
    } catch (e) {
      console.error("Failed to update consulta:", e);
    }
  }

  return (
    !consulta.planId ? (
      <Button type="button" variant="outline" onClick={checkPlanSending}>
        Marcar Dieta Enviada
        <Upload />
      </Button>
    ) : (
      <div>
        <CircleCheckBig />
        Dieta enviada em { consulta.planId }
      </div>
    )
  )
}