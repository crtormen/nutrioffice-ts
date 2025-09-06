import { zodResolver } from "@hookform/resolvers/zod";
import { InputMask } from "@react-input/mask";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
// import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IMeal } from "@/domain/entities";

import { MASK_TYPE } from "../form";
import { useConsultaContext } from "./context/ConsultaContext";

const mealsFormValidationSchema = z.object({
  meals: z.array(
    z.object({
      time: z.string(),
      meal: z.string(),
    }),
  ),
});

type mealsFormInputs = z.infer<typeof mealsFormValidationSchema>;

export const SetFeedingHistoryDrawer = () => {
  const [feedingDrawerOpen, setFeedingDrawerOpen] = useState<boolean>(false);
  const { consulta, handleSetMeals } = useConsultaContext();
  const {
    handleSubmit,
    register,
    control,
    formState: { errors, isSubmitting },
  } = useForm<mealsFormInputs>({
    resolver: zodResolver(mealsFormValidationSchema),
    values: consulta.meals
      ? {
          meals: consulta.meals,
        }
      : undefined,
  });
  const { fields, append, remove } = useFieldArray({
    name: "meals",
    control,
  });

  function handleSaveFeedingHistory(data: mealsFormInputs) {
    handleSetMeals(data.meals as IMeal[]);
    toast.success("Recordatório alimentar salvo com sucesso.");
    setFeedingDrawerOpen(false);
  }

  return (
    <>
      {consulta.meals && (
        <div className="flex flex-col gap-2">
          {consulta.meals.map((meal, i) => (
            <div key={i} className="flex items-center justify-start gap-4">
              <div className="text-sm font-medium text-muted-foreground">
                {meal.time}
              </div>
              <div className="text-sm font-semibold leading-6 text-foreground">
                {meal.meal}
              </div>
            </div>
          ))}
        </div>
      )}
      <Drawer
        direction="right"
        open={feedingDrawerOpen}
        onOpenChange={(isOpen) => {
          setFeedingDrawerOpen(isOpen);
          // setCollabToEdit(undefined);
        }}
      >
        <DrawerTrigger asChild>
          <Button variant="ghost">
            <Plus /> Recordatório Alimentar
          </Button>
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay className="fixed inset-0 bg-black/30" />
          <DrawerContent className="fixed bottom-0 right-0 mt-24 flex h-full w-[600px] flex-col overflow-auto rounded-t-[10px] p-4">
            <DrawerHeader>
              <DrawerTitle>Recordatório Alimentar</DrawerTitle>
              <DrawerDescription>
                Adicione a rotina alimentar atual do cliente.
              </DrawerDescription>
            </DrawerHeader>
            <Separator className="my-2" />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit(handleSaveFeedingHistory, (error: unknown) => {
                  toast.error("Erro ao salvar recordatório alimentar");
                  throw new Error(error as string);
                })(e);
              }}
              className="flex flex-1 flex-col gap-5"
            >
              <div className="flex w-full flex-col">
                {fields.map((field, i) => {
                  return (
                    <div className="flex flex-col gap-2 p-4" key={field.id}>
                      <div className="flex w-full items-start gap-1">
                        <div className="w-1/5 text-sm">{`Refeição ${i + 1}`}</div>
                        <div className="flex w-3/5 flex-col gap-2">
                          <InputMask
                            {...register(`meals.${i}.time` as const)}
                            mask={MASK_TYPE.time}
                            replacement={{ _: /\d/ }}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="__:__"
                            defaultValue={field.time}
                            // error={errors.meals?.[i]?.time}
                          />
                          <Textarea
                            {...register(`meals.${i}.meal` as const)}
                            placeholder="Escreva a refeição"
                            defaultValue={field.meal}
                            rows={2}
                            // error={errors.meals?.[i]?.meal}
                          />
                        </div>
                        <Button
                          variant="link"
                          onClick={() => remove(i)}
                          className="w-1/5 items-center text-destructive"
                        >
                          <Trash2 size={20} />
                        </Button>
                      </div>
                      <div className="p-1 text-destructive">
                        {errors.meals?.[i]?.time &&
                          errors.meals?.[i]?.time?.message}
                        {errors.meals?.[i]?.meal &&
                          errors.meals?.[i]?.meal?.message}
                      </div>
                    </div>
                  );
                })}
                <Button
                  className="w-3/5 self-center"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    append({
                      meal: "",
                      time: "",
                    });
                  }}
                >
                  <Plus />
                  Adicionar Refeição
                </Button>
              </div>
              <DrawerFooter>
                <Separator className="my-2" />
                <DrawerClose asChild>
                  <Button variant="ghost" type="button">
                    Cancelar
                  </Button>
                </DrawerClose>
                <Button type="submit" variant="success" disabled={isSubmitting}>
                  Salvar
                </Button>
              </DrawerFooter>
            </form>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    </>
  );
};
