import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/app/router/routes";
import {
  selectCustomerByPhone,
  useFetchCustomersQuery,
} from "@/app/state/features/customersSlice";
import { useAppSelector } from "@/app/state/hooks";
import { useAuth } from "@/infra/firebase/hooks/useAuth";

interface ChatwootEventData {
  event: string;
  data?: {
    contact?: {
      phone_number?: string;
    };
  };
}

export const ChatwootPage = () => {
  const navigate = useNavigate();
  const { dbUid } = useAuth();
  const [incomingPhone, setIncomingPhone] = useState("");
  const [searching, setSearching] = useState(false);

  useFetchCustomersQuery(dbUid);

  const selectByPhone = useMemo(() => selectCustomerByPhone(dbUid, incomingPhone), [dbUid, incomingPhone]);
  const matchedCustomer = useAppSelector(selectByPhone);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      let parsed: ChatwootEventData;
      try {
        parsed =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      if (parsed?.event !== "appContext") return;

      const phone = parsed?.data?.contact?.phone_number;
      if (phone) {
        setSearching(true);
        setIncomingPhone(phone);
      }
    };

    window.addEventListener("message", handleMessage);

    // Request conversation data from Chatwoot parent frame
    window.parent.postMessage("chatwoot-dashboard-app:fetch-info", "*");

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (!incomingPhone) return;

    if (matchedCustomer?.id) {
      navigate(ROUTES.CUSTOMERS.DETAILS(matchedCustomer.id));
    } else {
      setSearching(false);
    }
  }, [matchedCustomer, incomingPhone, navigate]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      {(!incomingPhone || searching) && (
        <p className="text-muted-foreground text-sm">
          Aguardando dados do contato via Chatwoot...
        </p>
      )}
      {incomingPhone && !searching && !matchedCustomer && (
        <p className="text-muted-foreground text-sm">
          Nenhum cliente encontrado com o telefone{" "}
          <span className="font-medium">{incomingPhone}</span>.
        </p>
      )}
    </div>
  );
};
