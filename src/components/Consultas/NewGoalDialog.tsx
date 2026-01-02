import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { IGoal } from "@/domain/entities";

import { useConsultaContext } from "./context/ConsultaContext";
import { useSaveGoal } from "./hooks/useSaveGoal";

export const newGoalValidationSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  params: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    }),
  ),
});

export type newGoalFormInputs = z.infer<typeof newGoalValidationSchema>;

/* TODO:
- exclude params options as they are chosen
- close datepicker dialog when a day were selected
*/

interface NewGoalDialogProps {
  children?: React.ReactNode;
  consulta?: {
    id: string;
    results?: { fat?: number; mg?: number; mm?: number; mr?: number; mo?: number };
    peso?: string;
  };
}

export const NewGoalDialog = ({ children, consulta: consultaProp }: NewGoalDialogProps = {}) => {
  const [goalDrawerOpen, setGoalDrawerOpen] = useState<boolean>(false);

  // Try to get consulta from props first, otherwise use context
  let consulta;
  try {
    const contextConsulta = useConsultaContext();
    consulta = consultaProp || contextConsulta.consulta;
  } catch {
    // If context is not available, use prop
    consulta = consultaProp;
  }
  const { handleSaveGoal, isSaving } = useSaveGoal();
  const form = useForm<newGoalFormInputs>({
    resolver: zodResolver(newGoalValidationSchema),
    // values: {
    //   // startDate: "",
    //   // endDate: "",
    //   startDate: new Date(),
    //   endDate: new Date(),
    //   params: [{ key: "", value: "" }],
    // },
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = form;
  const { fields, append, remove } = useFieldArray({
    name: "params",
    control,
  });

  const options = {
    fat: "% de Gordura",
    peso: "Peso",
    mm: "Massa Magra",
    mg: "Massa Gorda",
  };

  const handleSubmitGoal = async (data: newGoalFormInputs) => {
    if (!consulta?.id) {
      toast.error("Consulta não encontrada. Por favor, preencha os dados da consulta primeiro.");
      return;
    }

    console.log(data.params);
    const params: {
      [key: string]: number;
    } = {};
    Object.values(data.params).forEach(
      (param) =>
        (params[param.key] = parseFloat(param.value.replace(",", "."))),
    );

    const goal: IGoal = {
      createdAt: format(data.startDate, "dd/MM/yyyy"),
      endDate: format(data.endDate, "dd/MM/yyyy"),
      firstConsulta_id: consulta.id,
      params,
    };
    console.log(goal);

    try {
      await handleSaveGoal(goal);
      setGoalDrawerOpen(false);
      toast.success("Meta criada com sucesso.");
    } catch (err: unknown) {
      toast.error("Algo inesperado ocorreu ao salvar a meta, tente novamente.");
      throw new Error(err as string);
    }
  };

  return consulta?.results && Object.keys(consulta.results).length > 0 ? (
    <Drawer
      direction="right"
      open={goalDrawerOpen}
      onOpenChange={(isOpen) => {
        setGoalDrawerOpen(isOpen);
        // setCollabToEdit(undefined);
      }}
    >
      <DrawerTrigger asChild>
        {children || (
          <Button variant="outline">
            <Plus /> Criar Meta
          </Button>
        )}
      </DrawerTrigger>
      <DrawerPortal>
        <DrawerOverlay className="fixed inset-0 bg-black/30" />
        <DrawerContent className="fixed bottom-0 right-0 mt-24 flex h-full w-[600px] flex-col overflow-auto rounded-t-[10px] p-4">
          <DrawerHeader>
            <DrawerTitle>Definir Meta</DrawerTitle>
            <DrawerDescription>
              Adicione a rotina alimentar atual do cliente.
            </DrawerDescription>
          </DrawerHeader>
          <Separator className="my-2" />
          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit(handleSubmitGoal, (error: unknown) => {
                  toast.error(
                    "O Formulário contém erros, corrija para salvar.",
                  );
                  throw new Error(error as string);
                })(e);
              }}
              className="flex flex-1 flex-col gap-10"
            >
              <div className="flex gap-10">
                <div className="flex flex-col gap-8">
                  <FormField
                    control={control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel>Início da Meta</FormLabel>
                        <FormControl>
                          <DateTimePicker
                            granularity="day"
                            locale={ptBR}
                            value={field.value}
                            modal={false}
                            onChange={field.onChange}
                            ref={field.ref}
                            displayFormat={{ hour24: "dd/MM/yyyy" }}
                            placeholder="Escolha uma data"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel>Data Alvo</FormLabel>
                        <FormControl>
                          <DateTimePicker
                            granularity="day"
                            locale={ptBR}
                            value={field.value}
                            modal={false}
                            onChange={field.onChange}
                            ref={field.ref}
                            displayFormat={{ hour24: "dd/MM/yyyy" }}
                            placeholder="Escolha uma data"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <Card className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <CardHeader className="font-semibold">
                    Avaliação Atual
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between gap-2">
                      <div>% de Gordura</div>
                      <div className="font-semibold text-foreground">
                        {consulta.results.fat} %
                      </div>
                    </div>
                    <div className="flex justify-between gap-2">
                      <div>Massa Gorda</div>
                      <div className="font-semibold text-foreground">
                        {consulta.results.mg} Kg
                      </div>
                    </div>
                    <div className="flex justify-between gap-2">
                      <div>Massa Magra</div>
                      <div className="font-semibold text-foreground">
                        {consulta.results.mm} Kg
                      </div>
                    </div>
                    <div className="flex justify-between gap-2">
                      <div>Peso</div>
                      <div className="font-semibold text-foreground">
                        {consulta.peso} Kg
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex w-full flex-col">
                {fields.map((arrayField, i) => {
                  return (
                    <div
                      className="flex flex-col gap-2 py-2"
                      key={arrayField.id}
                    >
                      <div className="flex w-full items-center gap-6">
                        <div className="w-1/5 text-sm">{`Parâmetro ${i + 1}`}</div>
                        <div className="flex w-3/5 gap-2">
                          <FormField
                            control={control}
                            name={`params.${i}.key`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <SelectTrigger className="w-[150px]">
                                      <SelectValue placeholder="Selecione um parâmetro" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup>
                                        <SelectLabel>Parâmetros</SelectLabel>
                                        {options &&
                                          Object.entries(options)?.map(
                                            ([option, label], i) => (
                                              <SelectItem
                                                key={i}
                                                value={option}
                                              >
                                                {label}
                                              </SelectItem>
                                            ),
                                          )}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name={`params.${i}.value`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...register(`params.${i}.value` as const)}
                                    placeholder="Valor alvo"
                                    className="w-[180px]"
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
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
                        {errors.params?.[i]?.key &&
                          errors.params?.[i]?.key?.message}
                        {errors.params?.[i]?.value &&
                          errors.params?.[i]?.value?.message}
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
                      key: "",
                      value: "",
                    });
                  }}
                >
                  <Plus />
                  Adicionar Parâmetro
                </Button>
              </div>
              <DrawerFooter>
                <Separator className="my-2" />
                <DrawerClose asChild>
                  <Button variant="ghost" type="button">
                    Cancelar
                  </Button>
                </DrawerClose>
                <Button
                  type="submit"
                  variant="success"
                  disabled={isSubmitting || isSaving}
                >
                  Salvar
                </Button>
              </DrawerFooter>
            </form>
          </Form>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  ) : (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus /> Criar Meta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Ops...</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="text-md p-2">
            Parece que você ainda não cadastrou a avaliação física do cliente.{" "}
            <br />É preciso os dados de resultado para criar uma nova meta.
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" type="button">
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
