import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import { IFolds, IMeasures, IResults, IStructure } from "@/domain/entities";
import { calculateAge } from "@/lib/utils";

import { evaluationFormInputs, STEPS } from "../SetEvaluationDrawer";
import { useConsultaContext } from "./ConsultaContext";

interface MultiStepEvaluationFormContextModel {
  steps: number;
  changeSteps: (steps: number) => void;
  isFirstStep: boolean;
  currentStepIndex: number;
  folds: IFolds;
  measures: IMeasures;
  structure: IStructure;
  results: IResults;
  idade: number;
  peso: number;
  changeFolds: (folds: IFolds) => void;
  changeMeasures: (measures: IMeasures) => void;
  changeStructure: (structure: IStructure) => void;
  nextStep: () => void;
  previousStep: () => void;
  goTo: (index: number) => void;
  calculate: (data: evaluationFormInputs, online: boolean) => void;
  handleSave: () => void;
}

export const MultiStepEvaluationFormContext =
  createContext<MultiStepEvaluationFormContextModel>(
    {} as MultiStepEvaluationFormContextModel,
  );

export interface MultiStepEvaluationFormProviderProps {
  children?: ReactNode;
}

export const MultiStepEvaluationFormProvider = ({
  children,
}: MultiStepEvaluationFormProviderProps): JSX.Element => {
  const { customer, handleSetEvaluation } = useConsultaContext();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [peso, setPeso] = useState(0);
  const [steps, setSteps] = useState(STEPS);
  const [measures, setMeasures] = useState<IMeasures>({} as IMeasures);
  const [structure, setStructure] = useState<IStructure>({} as IStructure);
  const [folds, setFolds] = useState<IFolds>({} as IFolds);
  const [results, setResults] = useState<IResults>({} as IResults);
  const [idade, setIdade] = useState(0);
  const isFirstStep = currentStepIndex === 0;

  useEffect(() => {
    if (customer) setIdade(calculateAge(customer?.birthday));
  }, [customer]);

  const changeSteps = useCallback((steps: number) => {
    setSteps(steps);
  }, []);

  const changePeso = useCallback((peso: number) => {
    setPeso(peso);
  }, []);

  const changeMeasures = useCallback((measures: IMeasures) => {
    setMeasures(measures);
  }, []);

  const changeStructure = useCallback((structure: IStructure) => {
    setStructure(structure);
  }, []);

  const changeFolds = useCallback((folds: IFolds) => {
    setFolds(folds);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps - 1) {
      setCurrentStepIndex((i) => i + 1);
    }
  }, [currentStepIndex, steps]);

  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1);
    }
  }, [currentStepIndex]);

  const goTo = useCallback((index: number) => {
    setCurrentStepIndex(index);
  }, []);

  const calculateResults = useCallback(() => {
    const dobras =
      folds.triceps +
      folds.peitoral +
      folds.axilar +
      folds.abdominal +
      folds.supra +
      folds.subescapular +
      folds.coxa;

    const densidade =
      customer?.gender === "H"
        ? 1.112 -
          0.00043499 * dobras +
          0.00000055 * dobras * dobras -
          0.00028826 * idade // HOMEM
        : 1.097 -
          0.00046971 * dobras +
          0.00000056 * dobras * dobras -
          0.00012828 * idade; // MULHER

    let fat = (4.95 / densidade - 4.5) * 100;
    fat = Number(fat.toFixed(2));

    let mg = peso * (fat / 100);
    mg = Number(mg.toFixed(2));

    let mo =
      3.02 *
      Math.pow(
        (((((((structure.altura / 100) * structure.altura) / 100) *
          structure.punho) /
          100) *
          structure.joelho) /
          100) *
          400,
        0.712,
      );
    mo = Number(mo.toFixed(2));

    let mr =
      customer?.gender === "H"
        ? peso * 0.241 // HOMEM
        : peso * 0.209; // MULHER
    mr = Number(mr.toFixed(2));

    let mm = peso - mg - mr - mo;
    mm = Number(mm.toFixed(2));

    return { dobras, fat, mg, mm, mo, mr };
  }, [customer?.gender, folds, idade, peso, structure]);

  useEffect(() => {
    if (peso > 0) {
      const results: IResults = calculateResults();
      setResults(results);
    }
  }, [calculateResults, peso]);

  const definePeso = useCallback(async (data: evaluationFormInputs) => {
    const peso = parseFloat(data.peso.replace(",", "."));
    setPeso(peso);
  }, []);

  const defineMeasures = useCallback(async (data: evaluationFormInputs) => {
    const measures: IMeasures = {
      circ_abdomen: data.circ_abdomen
        ? parseFloat(data.circ_abdomen.replace(",", "."))
        : undefined,
      circ_braco_dir: data.circ_braco_dir
        ? parseFloat(data.circ_braco_dir.replace(",", "."))
        : undefined,
      circ_braco_esq: data.circ_braco_esq
        ? parseFloat(data.circ_braco_esq.replace(",", "."))
        : undefined,
      circ_cintura: data.circ_cintura
        ? parseFloat(data.circ_cintura.replace(",", "."))
        : undefined,
      circ_coxa_dir: data.circ_coxa_dir
        ? parseFloat(data.circ_coxa_dir.replace(",", "."))
        : undefined,
      circ_coxa_esq: data.circ_coxa_esq
        ? parseFloat(data.circ_coxa_esq.replace(",", "."))
        : undefined,
      circ_gluteo: data.circ_gluteo
        ? parseFloat(data.circ_gluteo.replace(",", "."))
        : undefined,
      circ_ombro: data.circ_ombro
        ? parseFloat(data.circ_ombro.replace(",", "."))
        : undefined,
      circ_panturrilha_dir: data.circ_panturrilha_dir
        ? parseFloat(data.circ_panturrilha_dir.replace(",", "."))
        : undefined,
      circ_panturrilha_esq: data.circ_panturrilha_esq
        ? parseFloat(data.circ_panturrilha_esq.replace(",", "."))
        : undefined,
      circ_peito: data.circ_peito
        ? parseFloat(data.circ_peito.replace(",", "."))
        : undefined,
    };

    setMeasures(measures);
  }, []);

  const defineFolds = useCallback(async (data: evaluationFormInputs) => {
    const folds: IFolds = {
      triceps: parseFloat(data.triceps.replace(",", ".")),
      peitoral: parseFloat(data.peitoral.replace(",", ".")),
      axilar: parseFloat(data.axilar.replace(",", ".")),
      subescapular: parseFloat(data.subescapular.replace(",", ".")),
      abdominal: parseFloat(data.abdominal.replace(",", ".")),
      supra: parseFloat(data.supra.replace(",", ".")),
      coxa: parseFloat(data.coxa.replace(",", ".")),
    };
    setFolds(folds);
  }, []);

  const defineStructure = useCallback(
    async (data: evaluationFormInputs) => {
      const { altura, joelho, punho } = customer?.structure
        ? customer.structure
        : data;
      const structure: IStructure = {
        altura: typeof altura === "string" ? parseInt(altura) : altura!,
        joelho:
          typeof joelho === "string"
            ? parseFloat(joelho.replace(",", "."))
            : joelho!,
        punho:
          typeof punho === "string"
            ? parseFloat(punho.replace(",", "."))
            : punho!,
      };

      setStructure(structure);
    },
    [customer?.structure],
  );

  const calculate = useCallback(
    (data: evaluationFormInputs, online: boolean) => {
      if (!online) {
        defineFolds(data);
      }
      defineStructure(data);
      defineMeasures(data);
      definePeso(data);
    },
    [defineFolds, defineMeasures, definePeso, defineStructure],
  );

  const handleSave = useCallback(
    (online: boolean) => {
      handleSetEvaluation(
        peso.toString(),
        idade,
        folds,
        measures,
        structure,
        results,
      );
      toast.success("Avaliação salva com sucesso");
    },
    [peso, idade, folds, handleSetEvaluation, measures, results, structure],
  );

  const values = useMemo(
    () => ({
      steps,
      changeSteps,
      currentStepIndex,
      isFirstStep,
      measures,
      structure,
      folds,
      results,
      idade,
      peso,
      nextStep,
      previousStep,
      goTo,
      changeMeasures,
      changeStructure,
      changeFolds,
      changePeso,
      calculate,
      handleSave,
    }),
    [
      steps,
      changeSteps,
      currentStepIndex,
      measures,
      structure,
      folds,
      results,
      idade,
      peso,
      isFirstStep,
      nextStep,
      previousStep,
      goTo,
      changeMeasures,
      changeStructure,
      changeFolds,
      changePeso,
      calculate,
      handleSave,
    ],
  );

  return (
    <MultiStepEvaluationFormContext.Provider value={values}>
      {children}
    </MultiStepEvaluationFormContext.Provider>
  );
};

export const useMultiStepEvaluationFormContext = () => {
  const multiStepEvaluationFormContext = useContext(
    MultiStepEvaluationFormContext,
  );

  if (!multiStepEvaluationFormContext) {
    throw new Error(
      "MultiStepEvaluationFormContext must be inside a MultiStepEvaluationFormProvider",
    );
  }

  return multiStepEvaluationFormContext;
};
