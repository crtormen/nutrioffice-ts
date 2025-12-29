import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Control,
  FieldErrors,
  FieldValues,
  useForm,
  UseFormRegister,
} from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { RESULTS } from "@/domain/entities";

import { useConsultaContext } from "./context/ConsultaContext";
import { useMultiStepEvaluationFormContext } from "./context/MultiStepEvaluationFormContext";
import { EvaluationFormResult } from "./EvaluationFormResults";
import { EvaluationFormStepOne } from "./EvaluationFormStepOne";
import { EvaluationFormStepThree } from "./EvaluationFormStepThree";
import { EvaluationFormStepTwo } from "./EvaluationFormStepTwo";

const ONLINE_STEPS = 3;
export const STEPS = 4;

export interface EvaluationFormStepProps<
  TFieldValues extends FieldValues = FieldValues,
> {
  online?: boolean;
  register?: UseFormRegister<TFieldValues>;
  control?: Control<TFieldValues>;
  errors?: FieldErrors<TFieldValues>;
}

const evaluationFormValidationSchema = z.object({
  peso: z.string(),
  howmuch: z.coerce.number().optional(),
  joelho: z.string().optional(),
  punho: z.string().optional(),
  altura: z.string().optional(),
  triceps: z.string(),
  peitoral: z.string(),
  axilar: z.string(),
  subescapular: z.string(),
  abdominal: z.string(),
  supra: z.string(),
  coxa: z.string(),
  circ_abdomen: z.string().optional(),
  circ_braco_dir: z.string().optional(),
  circ_braco_esq: z.string().optional(),
  circ_cintura: z.string().optional(),
  circ_coxa_dir: z.string().optional(),
  circ_coxa_esq: z.string().optional(),
  circ_gluteo: z.string().optional(),
  circ_ombro: z.string().optional(),
  circ_panturrilha_dir: z.string().optional(),
  circ_panturrilha_esq: z.string().optional(),
  circ_peito: z.string().optional(),
});

export type evaluationFormInputs = z.infer<
  typeof evaluationFormValidationSchema
>;

export const SetEvaluationDrawer = ({ online }: { online: boolean }) => {
  const [evaluationDrawerOpen, setEvaluationDrawerOpen] =
    useState<boolean>(false);
  const { consulta } = useConsultaContext();
  const {
    currentStepIndex,
    isFirstStep,
    steps,
    changeSteps,
    nextStep,
    previousStep,
    calculate,
    handleSave,
  } = useMultiStepEvaluationFormContext();
  const {
    handleSubmit,
    register,
    control,
    formState: { errors, isSubmitting },
  } = useForm<evaluationFormInputs>({
    resolver: zodResolver(evaluationFormValidationSchema),
    values: {
      peso: consulta.peso?.toString() || "",
      howmuch: consulta.howmuch,
      joelho: consulta.structure?.joelho?.toString() || "",
      punho: consulta.structure?.punho?.toString() || "",
      altura: consulta.structure?.altura?.toString() || "",
      triceps: consulta.dobras?.triceps?.toString() || "",
      peitoral: consulta.dobras?.peitoral?.toString() || "",
      axilar: consulta.dobras?.axilar?.toString() || "",
      subescapular: consulta.dobras?.subescapular?.toString() || "",
      abdominal: consulta.dobras?.abdominal?.toString() || "",
      supra: consulta.dobras?.supra?.toString() || "",
      coxa: consulta.dobras?.coxa?.toString() || "",
      circ_abdomen: consulta.medidas?.circ_abdomen?.toString() || "",
      circ_braco_dir: consulta.medidas?.circ_braco_dir?.toString() || "",
      circ_braco_esq: consulta.medidas?.circ_braco_esq?.toString() || "",
      circ_cintura: consulta.medidas?.circ_cintura?.toString() || "",
      circ_coxa_dir: consulta.medidas?.circ_coxa_dir?.toString() || "",
      circ_coxa_esq: consulta.medidas?.circ_coxa_esq?.toString() || "",
      circ_gluteo: consulta.medidas?.circ_gluteo?.toString() || "",
      circ_ombro: consulta.medidas?.circ_ombro?.toString() || "",
      circ_panturrilha_dir:
        consulta.medidas?.circ_panturrilha_dir?.toString() || "",
      circ_panturrilha_esq:
        consulta.medidas?.circ_panturrilha_esq?.toString() || "",
      circ_peito: consulta.medidas?.circ_peito?.toString() || "",
    },
  });

  useEffect(() => {
    if (online) changeSteps(ONLINE_STEPS);
    else changeSteps(STEPS);
  }, [online]);

  console.log(steps);

  const handleSetPhysicalEvaluation = (data: evaluationFormInputs) => {
    calculate(data, online);
    nextStep();
  };

  return (
    <>
      {consulta && consulta.results && consulta.peso ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-start gap-4">
            <div className="text-sm font-medium text-muted-foreground">
              Peso
            </div>
            <div className="text-sm font-semibold leading-6 text-foreground">
              {consulta.peso}
            </div>
          </div>
          {!online &&
            Object.entries(consulta.results).map(([key, value], i) => (
              <div key={i} className="flex items-center justify-start gap-4">
                <div className="text-sm font-medium text-muted-foreground">
                  {RESULTS.find((r) => r.value === key)?.label || key}
                </div>
                <div className="text-sm font-semibold leading-6 text-foreground">
                  {value}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div></div>
      )}
      <Drawer
        direction="right"
        open={evaluationDrawerOpen}
        onOpenChange={(isOpen) => {
          setEvaluationDrawerOpen(isOpen);
          // setCollabToEdit(undefined);
        }}
        data-vaul-no-drag
      >
        <DrawerTrigger asChild>
          <Button variant="ghost">
            <Plus /> Avaliação Física
          </Button>
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay className="fixed inset-0 bg-black/30" />
          <DrawerContent
            data-vaul-no-drag
            className="fixed bottom-0 right-0 mt-24 flex h-full w-[600px] flex-col overflow-auto rounded-t-[10px] p-4 "
          >
            <DrawerHeader>
              <DrawerTitle>Avaliação Física</DrawerTitle>
              <DrawerDescription>
                Adicione a avaliação física do cliente.
              </DrawerDescription>
            </DrawerHeader>
            <Separator className="my-2" />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit(handleSetPhysicalEvaluation, (error) => {
                  toast.error(
                    "Ops...algo deu errado. Verifique se algum campo apresenta erro clicando em Voltar",
                  );
                  console.error(error);
                })(e);
              }}
              className="flex flex-1 flex-col gap-5"
            >
              {!online ? (
                <div className="flex flex-grow">
                  {currentStepIndex === 0 && (
                    <EvaluationFormStepOne
                      register={register}
                      control={control}
                      errors={errors}
                    />
                  )}
                  {currentStepIndex === 1 && (
                    <EvaluationFormStepTwo
                      register={register}
                      control={control}
                      errors={errors}
                    />
                  )}
                  {currentStepIndex === 2 && (
                    <EvaluationFormStepThree
                      register={register}
                      control={control}
                      errors={errors}
                    />
                  )}

                  {currentStepIndex === 3 && <EvaluationFormResult />}
                </div>
              ) : (
                <div className="flex flex-grow">
                  {currentStepIndex === 0 && (
                    <EvaluationFormStepOne
                      online={true}
                      register={register}
                      control={control}
                      errors={errors}
                    />
                  )}
                  {currentStepIndex === 1 && (
                    <EvaluationFormStepThree
                      register={register}
                      control={control}
                      errors={errors}
                    />
                  )}

                  {currentStepIndex === 2 && (
                    <EvaluationFormResult online={true} />
                  )}
                </div>
              )}
              <DrawerFooter className="h-1/5">
                <Separator className="my-2" />
                <div className="flex justify-center gap-4">
                  {isFirstStep ? (
                    <DrawerClose asChild>
                      <Button variant="ghost" type="button">
                        Cancelar
                      </Button>
                    </DrawerClose>
                  ) : (
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        previousStep();
                      }}
                    >
                      <ChevronLeft />
                      Voltar
                    </Button>
                  )}
                  {currentStepIndex === steps - 2 ? (
                    <Button
                      type="submit"
                      variant="success"
                      disabled={isSubmitting}
                    >
                      Calcular
                    </Button>
                  ) : currentStepIndex === steps - 1 ? (
                    <Button
                      variant="success"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSave(online);
                        setEvaluationDrawerOpen(false);
                      }}
                    >
                      Salvar
                    </Button>
                  ) : (
                    <Button
                      variant="success"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        nextStep();
                      }}
                    >
                      Avançar
                      <ChevronRight />
                    </Button>
                  )}
                </div>
              </DrawerFooter>
            </form>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    </>
  );
};
