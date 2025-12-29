import { format } from "date-fns";
import equal from "fast-deep-equal";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

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
import type { newConsultaFormInputs } from "@/pages/consultas/NewConsultaPage";

import { useSaveNewConsulta } from "../hooks/useSaveNewConsulta";

enum ActionTypes {
  setID = "SET_ID",
  setOnline = "SET_ONLINE",
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
  [ActionTypes.setOnline]: {
    online: boolean;
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
    online: boolean;
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
    online: boolean;
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
  handleSetFormData: (params: newConsultaFormInputs, pending: boolean) => void;
  handleSetImages: (images: IImages) => void;
  handleSetEvaluation: (
    online: boolean,
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
  handleSetOnline: (online: boolean) => void;
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
  online: false,
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

/**
 * Check if consulta has any meaningful user data beyond default/empty values
 */
function hasConsultaMeaningfulData(consulta: ICustomerConsulta): boolean {
  // Check meals
  if (consulta.meals && consulta.meals.length > 0) return true;

  // Check weight
  if (consulta.peso && consulta.peso !== "") return true;

  // Check attachments
  if (consulta.anexos && consulta.anexos.length > 0) return true;

  // Check images (at least one image uploaded)
  if (consulta.images) {
    const hasImages =
      (consulta.images.img_frente &&
        Object.keys(consulta.images.img_frente).length > 0) ||
      (consulta.images.img_costas &&
        Object.keys(consulta.images.img_costas).length > 0) ||
      (consulta.images.img_lado &&
        Object.keys(consulta.images.img_lado).length > 0);
    if (hasImages) return true;
  }

  // Check folds (dobras) - at least one measurement
  if (consulta.dobras && Object.keys(consulta.dobras).length > 0) {
    const hasValidFold = Object.values(consulta.dobras).some(
      (val) => val && val !== 0,
    );
    if (hasValidFold) return true;
  }

  // Check measures (medidas) - at least one measurement
  if (consulta.medidas && Object.keys(consulta.medidas).length > 0) {
    const hasValidMeasure = Object.values(consulta.medidas).some(
      (val) => val && val !== 0,
    );
    if (hasValidMeasure) return true;
  }

  // Check results - at least one result
  if (consulta.results && Object.keys(consulta.results).length > 0) {
    const hasValidResult = Object.values(consulta.results).some(
      (val) => val && val !== 0,
    );
    if (hasValidResult) return true;
  }

  // Check observations
  if (consulta.obs && consulta.obs.trim() !== "") return true;

  return false;
}

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
  const previousConsultaRef = useRef<ICustomerConsulta>(
    initialState as ICustomerConsulta,
  );

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
      case "SET_ONLINE":
        newConsulta = {
          ...consulta,
          online: action.payload.online,
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
          online: action.payload.online,
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

  const handleSetOnline = useCallback((online: boolean) => {
    dispatch({
      type: ActionTypes.setOnline,
      payload: { online },
    });
  }, []);

  const handleSetDate = useCallback((date: string) => {
    const newConsulta = { ...previousConsultaRef.current, date };
    if (!equal(newConsulta, previousConsultaRef.current)) {
      dispatch({
        type: ActionTypes.setDate,
        payload: { date },
      });
      setConsultaChanged(true);
    }
  }, []);

  const handleSetUpdateCredits = useCallback((updateCredits: boolean) => {
    const newConsulta = { ...previousConsultaRef.current, updateCredits };
    if (!equal(newConsulta, previousConsultaRef.current)) {
      dispatch({
        type: ActionTypes.setUpdateCredits,
        payload: { updateCredits },
      });
      setConsultaChanged(true);
    }
  }, []);

  const handleSetFormData = useCallback(
    (
      { updateCredits, date, obs, online }: newConsultaFormInputs,
      pending: boolean,
    ) => {
      const newData = {
        updateCredits: updateCredits || false,
        online: online || false,
        date: format(date, "dd/MM/yyyy"),
        obs,
        pending,
      };
      const newConsulta = { ...previousConsultaRef.current, ...newData };
      if (!equal(newConsulta, previousConsultaRef.current)) {
        dispatch({
          type: ActionTypes.setFormData,
          payload: newData,
        });
        setConsultaChanged(true);
      }
    },
    [],
  );

  const handleSetMeals = useCallback((meals: IMeal[]) => {
    const newConsulta = { ...previousConsultaRef.current, meals };
    if (!equal(newConsulta.meals, previousConsultaRef.current.meals)) {
      dispatch({
        type: ActionTypes.setMeals,
        payload: { meals },
      });
      setConsultaChanged(true);
    }
  }, []);

  const handleSetAnexos = useCallback((anexos: IAttachment[]) => {
    if (!equal(anexos, previousConsultaRef.current.anexos)) {
      dispatch({
        type: ActionTypes.setAnexos,
        payload: { anexos },
      });
      setConsultaChanged(true);
    }
  }, []);

  const handleSetImages = useCallback((images: IImages) => {
    if (!equal(images, previousConsultaRef.current.images)) {
      dispatch({
        type: ActionTypes.setImages,
        payload: { images },
      });
      setConsultaChanged(true);
    }
  }, []);

  const handleSetEvaluation = useCallback(
    (
      online: boolean,
      peso: string,
      idade: number,
      dobras: IFolds,
      medidas: IMeasures,
      structure: IStructure,
      results: IResults,
    ) => {
      const newData = {
        online,
        peso,
        idade,
        dobras,
        medidas,
        structure,
        results,
      };
      const newConsulta = { ...previousConsultaRef.current, ...newData };
      if (!equal(newConsulta, previousConsultaRef.current)) {
        dispatch({
          type: ActionTypes.setEvaluation,
          payload: newData,
        });
        setConsultaChanged(true);
      }
    },
    [],
  );

  const handleSetObs = useCallback((obs: string) => {
    if (obs !== previousConsultaRef.current.obs) {
      dispatch({
        type: ActionTypes.setObs,
        payload: { obs },
      });
      setConsultaChanged(true);
    }
  }, []);

  const handleSetGoal = useCallback((goal: IGoal) => {
    setGoal(goal);
    // setConsultaChanged(true);
  }, []);

  // Update previousConsultaRef whenever consulta changes
  useEffect(() => {
    previousConsultaRef.current = consulta;
  }, [consulta]);

  // Effect 1: Initial consulta creation (only when meaningful data exists)
  useEffect(() => {
    const createConsulta = async () => {
      if (!consulta || !customerId || !consultaChanged || consultaCreated)
        return;

      // IMPORTANT: Only create consulta if it has meaningful user data
      if (!hasConsultaMeaningfulData(consulta)) {
        console.log("Skipping consulta creation - no meaningful data");
        setConsultaChanged(false);
        return;
      }

      // If consulta_id not defined yet, create consulta in Firebase
      // with pending = true, and store consulta_id at consultareducer;
      setConsultaCreated(true);
      setConsultaChanged(false);
      try {
        const id = await handleCreateNewConsulta(consulta);
        if (!id || id === "") return; // something went wrong
        console.log("Created consulta with ID:", id);
        handleSetId(id);
      } catch (err: unknown) {
        toast.error(
          "Houve um problema ao salvar a consulta. Tente novamente. Caso o problema persista, contate o suporte",
        );
        throw new Error(err as string);
      }
    };
    createConsulta();
  }, [
    consulta,
    consultaChanged,
    consultaCreated,
    customerId,
    handleCreateNewConsulta,
    handleSetId,
  ]);

  // Effect 2: Update existing consulta (only when consultaChanged flag is true)
  useEffect(() => {
    if (!customerId || !consulta || !consultaCreated || !consultaChanged) {
      return;
    }
    console.log("Updating consulta", consulta);
    handleUpdateConsulta(consulta);
    setConsultaChanged(false);
  }, [
    consultaChanged,
    customerId,
    consulta,
    consultaCreated,
    handleUpdateConsulta,
  ]);

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
      handleSetOnline,
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
      handleSetOnline,
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
