import { format } from "date-fns";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { useParams } from "react-router-dom";

import { useGetCustomerData } from "@/components/Customers/hooks";
import {
  IAttachment,
  ICustomer,
  ICustomerConsulta,
  IFolds,
  type IGoal,
  IImages,
  IMeal,
  IMeasures,
  IResults,
  IStructure,
} from "@/domain/entities";

import { useSaveNewConsulta } from "../hooks/useSaveNewConsulta";

enum ActionTypes {
  setID = "SET_ID",
  setPending = "SET_PENDING",
  setDate = "SET_DATE",
  setUpdateCredits = "SET_UPDATECREDITS",
  setFormData = "SET_FORM_DATA",
  setMeals = "SET_MEALS",
  setAnexos = "SET_ANEXOS",
  setImages = "SET_IMAGES",
  setEvaluation = "SET_EVALUATION",
  setObs = "SET_OBS",
}

type Payload = {
  [ActionTypes.setID]: {
    id: string;
  };
  [ActionTypes.setPending]: {
    pending: boolean;
  };
  [ActionTypes.setDate]: {
    date: string;
  };
  [ActionTypes.setUpdateCredits]: {
    updateCredits: boolean;
  };
  [ActionTypes.setFormData]: {
    updateCredits: boolean;
    date: string;
    obs: string;
    pending: boolean;
  };
  [ActionTypes.setMeals]: {
    meals: IMeal[];
  };
  [ActionTypes.setAnexos]: {
    anexos: IAttachment[];
  };
  [ActionTypes.setImages]: {
    images: IImages;
  };
  [ActionTypes.setEvaluation]: {
    peso: string;
    idade: number;
    medidas: IMeasures;
    dobras: IFolds;
    results: IResults;
    structure: IStructure;
  };
  [ActionTypes.setObs]: {
    obs: string;
  };
};

type ActionMap<M extends { [index: string]: unknown }> = {
  [Key in keyof M]: M[Key] extends undefined
    ? {
        type: Key;
      }
    : {
        type: Key;
        payload: M[Key];
      };
};

type Action = ActionMap<Payload>[keyof ActionMap<Payload>];

interface ConsultaContextModel {
  consulta: ICustomerConsulta;
  customer?: ICustomer;
  isSaving: boolean;
  isUpdating: boolean;
  handleSetAnexos: (anexos: IAttachment[]) => void;
  handleSetDate: (date: string) => void;
  handleSetFormData: (
    updateCredits: boolean,
    date: string,
    obs: string,
    pending: boolean,
  ) => void;
  handleSetImages: (images: IImages) => void;
  handleSetEvaluation: (
    peso: string,
    idade: number,
    dobras: IFolds,
    medidas: IMeasures,
    structure: IStructure,
    results: IResults,
  ) => void;
  handleSetMeals: (meals: IMeal[]) => void;
  handleSetObs: (obs: string) => void;
  handleSetUpdateCredits: (updateCredits: boolean) => void;
  handleSetPending: (pending: boolean) => void;
}

export const ConsultaContext = createContext<ConsultaContextModel>(
  {} as ConsultaContextModel,
);

export interface ConsultaProviderProps {
  children?: ReactNode;
}

const initialState = {
  customer_id: "",
  pending: true,
  createdAt: format(new Date(), "dd/MM/yyyy"),
  id: "",
  name: "",
  howmuch: 0,
  peso: "",
  idade: 0,
  updateCredits: false,
  date: format(new Date(), "dd/MM/yyyy"),
  anexos: [] as IAttachment[],
  images: { img_frente: {}, img_costas: {}, img_lado: {} } as IImages,
  dobras: {} as IFolds,
  medidas: {} as IMeasures,
  structure: {} as IStructure,
  results: {} as IResults,
  meals: [],
  obs: "",
};

export const ConsultaProvider = ({
  children,
}: ConsultaProviderProps): JSX.Element => {
  const { customerId } = useParams();
  const customer = useGetCustomerData(customerId);
  const {
    handleCreateNewConsulta,
    handleUpdateConsulta,
    isSaving,
    isUpdating,
  } = useSaveNewConsulta();
  const [consulta, dispatch] = useReducer(
    consultaReducer,
    initialState as ICustomerConsulta,
  );
  const [goal, setGoal] = useState<IGoal>();
  const [consultaChanged, setConsultaChanged] = useState(false);
  const [consultaCreated, setConsultaCreated] = useState(false);

  function consultaReducer(
    consulta: ICustomerConsulta,
    action: Action,
  ): ICustomerConsulta {
    let newConsulta: ICustomerConsulta;
    switch (action.type) {
      case "SET_ID":
        newConsulta = {
          ...consulta,
          id: action.payload.id,
        };
        break;
      case "SET_PENDING":
        newConsulta = {
          ...consulta,
          pending: action.payload.pending,
        };
        break;
      case "SET_DATE":
        newConsulta = {
          ...consulta,
          date: action.payload.date,
        };
        break;
      case "SET_UPDATECREDITS":
        newConsulta = {
          ...consulta,
          updateCredits: action.payload.updateCredits,
        };
        break;
      case "SET_FORM_DATA":
        newConsulta = {
          ...consulta,
          updateCredits: action.payload.updateCredits,
          date: action.payload.date,
          obs: action.payload.obs,
          pending: action.payload.pending,
        };
        break;
      case "SET_MEALS":
        newConsulta = {
          ...consulta,
          meals: action.payload.meals,
        };
        break;
      case "SET_ANEXOS":
        newConsulta = {
          ...consulta,
          anexos: action.payload.anexos,
        };
        break;
      case "SET_IMAGES":
        newConsulta = {
          ...consulta,
          images: action.payload.images,
        };
        break;
      case "SET_EVALUATION":
        newConsulta = {
          ...consulta,
          peso: action.payload.peso,
          dobras: action.payload.dobras,
          medidas: action.payload.medidas,
          structure: action.payload.structure,
          results: action.payload.results,
        };
        break;
      case "SET_OBS":
        newConsulta = {
          ...consulta,
          obs: action.payload.obs,
        };
        break;
      default:
        newConsulta = consulta;
    }

    return newConsulta;
  }

  const handleSetId = useCallback((id: string) => {
    dispatch({
      type: ActionTypes.setID,
      payload: { id },
    });
  }, []);

  const handleSetPending = useCallback((pending: boolean) => {
    dispatch({
      type: ActionTypes.setPending,
      payload: { pending },
    });
  }, []);

  const handleSetDate = useCallback((date: string) => {
    dispatch({
      type: ActionTypes.setDate,
      payload: { date },
    });
    setConsultaChanged(true);
  }, []);

  const handleSetUpdateCredits = useCallback((updateCredits: boolean) => {
    dispatch({
      type: ActionTypes.setUpdateCredits,
      payload: { updateCredits },
    });
    setConsultaChanged(true);
  }, []);

  const handleSetFormData = useCallback(
    (updateCredits: boolean, date: string, obs: string, pending: boolean) => {
      dispatch({
        type: ActionTypes.setFormData,
        payload: {
          updateCredits,
          date,
          obs,
          pending,
        },
      });
      setConsultaChanged(true);
    },
    [],
  );

  const handleSetMeals = useCallback((meals: IMeal[]) => {
    dispatch({
      type: ActionTypes.setMeals,
      payload: { meals },
    });
    setConsultaChanged(true);
  }, []);

  const handleSetAnexos = useCallback((anexos: IAttachment[]) => {
    dispatch({
      type: ActionTypes.setAnexos,
      payload: { anexos },
    });
    setConsultaChanged(true);
  }, []);

  const handleSetImages = useCallback((images: IImages) => {
    dispatch({
      type: ActionTypes.setImages,
      payload: { images },
    });
    setConsultaChanged(true);
  }, []);

  const handleSetEvaluation = useCallback(
    (
      peso: string,
      idade: number,
      dobras: IFolds,
      medidas: IMeasures,
      structure: IStructure,
      results: IResults,
    ) => {
      dispatch({
        type: ActionTypes.setEvaluation,
        payload: { peso, idade, dobras, medidas, structure, results },
      });
      setConsultaChanged(true);
    },
    [],
  );

  const handleSetObs = useCallback((obs: string) => {
    dispatch({
      type: ActionTypes.setObs,
      payload: { obs },
    });
    setConsultaChanged(true);
  }, []);

  const handleSetGoal = useCallback((goal: IGoal) => {
    setGoal(goal);
    // setConsultaChanged(true);
  }, []);

  useEffect(() => {
    const createConsulta = async () => {
      if (!consulta || !customerId || !consultaChanged || consultaCreated)
        return;
      // If consulta_id not defined yet, create consulta in Firebase
      // with pending = true, and store consulta_id at consultareducer;
      setConsultaCreated(true);
      setConsultaChanged(false);
      const id = await handleCreateNewConsulta(consulta);
      if (!id || id === "") return; // something went wrong
      console.log(id);
      handleSetId(id);
    };
    createConsulta();
  }, [
    consulta,
    consultaChanged,
    consultaCreated,
    customerId,
    handleCreateNewConsulta,
    handleSetId,
    handleUpdateConsulta,
  ]);

  useEffect(() => {
    if (!customerId || !consulta || !consultaCreated || !consultaChanged) {
      return;
    }
    console.log("Update Consulta", consulta);
    handleUpdateConsulta(consulta);
    setConsultaChanged(false);
  }, [consulta]);

  // se já tiver consulta_id, atualiza sempre que consulta atualizar

  // se ao finalizar, clicar em salvar, pending = false e salva tb ConsultaFirebase

  const values = useMemo(
    () => ({
      consulta,
      customer,
      goal,
      isSaving,
      isUpdating,
      handleSetDate,
      handleSetUpdateCredits,
      handleSetFormData,
      handleSetMeals,
      handleSetAnexos,
      handleSetImages,
      handleSetEvaluation,
      handleSetObs,
      handleSetGoal,
      handleSetPending,
    }),
    [
      consulta,
      customer,
      goal,
      isSaving,
      isUpdating,
      handleSetAnexos,
      handleSetDate,
      handleSetFormData,
      handleSetImages,
      handleSetEvaluation,
      handleSetMeals,
      handleSetObs,
      handleSetGoal,
      handleSetUpdateCredits,
      handleSetPending,
    ],
  );

  return (
    <ConsultaContext.Provider value={values}>
      {children}
    </ConsultaContext.Provider>
  );
};

export const useConsultaContext = () => {
  const consultaContext = useContext(ConsultaContext);

  if (!consultaContext) {
    throw new Error("useConsultaContext must be inside a ConsultaProvider");
  }

  return consultaContext;
};
