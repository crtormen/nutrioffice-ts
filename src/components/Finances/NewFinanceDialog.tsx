import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { useAddCustomerFinanceMutation } from "@/app/state/features/customerFinancesSlice";
import { useFetchSettingsQuery } from "@/app/state/features/settingsSlice";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import {
  IFinanceItem,
  INSTALLMENT_ENABLED_METHODS,
  PAYMENT_METHODS,
} from "@/domain/entities/finances";
import { IServiceConfig } from "@/domain/entities/settings";
import { useAuth } from "@/infra/firebase/hooks";
import { formatDateForInput } from "@/lib/utils";

const paymentSchema = z.object({
  method: z.string().optional(),
  paymentDate: z.string().optional(),
  amount: z.coerce.number().min(0).optional(),
  obs: z.string().optional(),
  hasInstallments: z.boolean().default(false),
  installmentsCount: z.coerce.number().min(1).max(24).optional(),
});

const financeSchema = z.object({
  discount: z.coerce.number().min(0).optional(),
  obs: z.string().optional(),
  payments: z.array(paymentSchema),
});

type FinanceFormInputs = z.infer<typeof financeSchema>;

interface NewFinanceDialogProps {
  customerId: string;
  variant?: "default" | "outline";
  children?: React.ReactNode;
}

export const NewFinanceDialog = ({
  customerId,
  variant = "default",
  children,
}: NewFinanceDialogProps) => {
  const { dbUid } = useAuth();
  const { toast } = useToast();
  const { data: settings } = useFetchSettingsQuery(dbUid);
  const [addCustomerFinance] = useAddCustomerFinanceMutation();
  const [isOpen, setIsOpen] = useState(false);

  // Selected services state
  const [selectedServices, setSelectedServices] = useState<{
    [key: string]: { service: IServiceConfig; quantity: number };
  }>({});

  const {
    register,
    control,
    reset,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FinanceFormInputs>({
    resolver: zodResolver(financeSchema),
    defaultValues: {
      discount: 0,
      obs: "",
      payments: [
        {
          method: "",
          paymentDate: formatDateForInput(),
          amount: 0,
          obs: "",
          hasInstallments: false,
          installmentsCount: 1,
        },
      ],
    },
  });

  const {
    fields: paymentFields,
    append: appendPayment,
    remove: removePayment,
  } = useFieldArray({
    name: "payments",
    control,
  });

  // Get all active services
  const allServices: Record<string, IServiceConfig> = {
    ...settings?.default?.services,
    ...settings?.custom?.services,
  };

  const activeServices = Object.entries(allServices).filter(
    ([, service]) => service.active,
  );

  // Calculate totals
  const calculateTotals = () => {
    const items: IFinanceItem[] = Object.entries(selectedServices).map(
      ([serviceId, { service, quantity }]) => ({
        serviceId,
        serviceName: service.name,
        quantity,
        unitPrice: service.price,
        totalPrice: service.price * quantity,
        credits: (service.credits || 0) * quantity,
      }),
    );

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = watch("discount") || 0;
    const total = Math.max(0, subtotal - discount);
    const creditsGranted = items.reduce((sum, item) => sum + item.credits, 0);

    return { items, subtotal, discount, total, creditsGranted };
  };

  const { items, subtotal, discount, total, creditsGranted } =
    calculateTotals();

  // Add service to sale
  const addService = (serviceId: string) => {
    const service = allServices[serviceId];
    if (!service) return;

    setSelectedServices((prev) => ({
      ...prev,
      [serviceId]: {
        service,
        quantity: prev[serviceId] ? prev[serviceId].quantity + 1 : 1,
      },
    }));
  };

  // Remove service from sale
  const removeService = (serviceId: string) => {
    setSelectedServices((prev) => {
      const newServices = { ...prev };
      delete newServices[serviceId];
      return newServices;
    });
  };

  // Update quantity
  const updateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeService(serviceId);
      return;
    }

    setSelectedServices((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        quantity,
      },
    }));
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Check if payment method can have installments
  const canHaveInstallments = (method: string | undefined) => {
    if (!method) return false;
    return (INSTALLMENT_ENABLED_METHODS as readonly string[]).includes(method);
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Use setTimeout to avoid flushSync warning
      const timeoutId = setTimeout(() => {
        setSelectedServices({});
        reset({
          discount: 0,
          obs: "",
          payments: [
            {
              method: "",
              paymentDate: formatDateForInput(),
              amount: 0,
              obs: "",
              hasInstallments: false,
              installmentsCount: 1,
            },
          ],
        });
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: FinanceFormInputs) => {
    try {
      if (items.length === 0) {
        toast({
          title: "Erro",
          description: "Adicione pelo menos um serviço à venda.",
          variant: "destructive",
        });
        return;
      }

      // Process payments - filter out empty payments
      const validPayments = data.payments
        .filter((p) => p.method && p.amount && p.amount > 0)
        .map((p) => ({
          createdAt: p.paymentDate
            ? new Date(p.paymentDate).toISOString()
            : new Date().toISOString(),
          method: p.method!,
          obs: p.obs,
          valor: p.amount!,
          hasInstallments: p.hasInstallments,
          installmentsCount: p.hasInstallments
            ? p.installmentsCount
            : undefined,
        }));

      await addCustomerFinance({
        uid: dbUid!,
        customerId,
        finance: {
          customerId,
          items,
          subtotal,
          discount: data.discount,
          total,
          pago: 0, // Will be calculated by mutation
          saldo: 0, // Will be calculated by mutation
          creditsGranted,
          status: "pending", // Will be calculated by mutation
          obs: data.obs,
          createdAt: new Date().toISOString(),
        },
        payments: validPayments.length > 0 ? validPayments : undefined,
      }).unwrap();

      toast({
        title: "Venda registrada",
        description: `Venda de ${formatCurrency(total)} criada com sucesso.${
          creditsGranted > 0
            ? ` ${creditsGranted} crédito(s) adicionado(s).`
            : ""
        }`,
      });

      setIsOpen(false);
    } catch (error) {
      console.error("Error creating finance:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a venda. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant={variant}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Venda
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Nova Venda</DialogTitle>
            <DialogDescription>
              Registrar uma nova venda para o cliente
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Service Selection */}
            <div className="space-y-2">
              <Label>Selecionar Serviço</Label>
              <Select onValueChange={addService}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {activeServices.map(([serviceId, service]) => (
                    <SelectItem key={serviceId} value={serviceId}>
                      {service.name} - {formatCurrency(service.price)}
                      {service.credits &&
                        service.credits > 0 &&
                        ` (${service.credits} crédito${service.credits > 1 ? "s" : ""})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Services List */}
            {Object.keys(selectedServices).length > 0 && (
              <div className="space-y-2">
                <Label>Serviços Adicionados</Label>
                <div className="divide-y rounded-lg border">
                  {Object.entries(selectedServices).map(
                    ([serviceId, { service, quantity }]) => (
                      <div
                        key={serviceId}
                        className="flex items-center justify-between p-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(service.price)} x {quantity} ={" "}
                            {formatCurrency(service.price * quantity)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) =>
                              updateQuantity(
                                serviceId,
                                parseInt(e.target.value) || 1,
                              )
                            }
                            className="w-16 rounded border px-2 py-1 text-center"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeService(serviceId)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="discount">Desconto (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("discount")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total</Label>
                  <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-lg font-bold">
                    {formatCurrency(total)}
                  </div>
                </div>
              </div>

              {creditsGranted > 0 && (
                <div className="text-sm text-muted-foreground">
                  Esta venda concederá {creditsGranted} crédito
                  {creditsGranted > 1 ? "s" : ""} ao cliente
                </div>
              )}
            </div>

            <Separator />

            {/* Payments Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Pagamentos (Opcional)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendPayment({
                      method: "",
                      paymentDate: formatDateForInput(),
                      amount: 0,
                      obs: "",
                      hasInstallments: false,
                      installmentsCount: 1,
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Pagamento
                </Button>
              </div>

              {paymentFields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-4 rounded-lg border bg-muted/30 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Pagamento {index + 1}</h4>
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePayment(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Método</Label>
                      <Controller
                        control={control}
                        name={`payments.${index}.method`}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {PAYMENT_METHODS.map((method) => (
                                <SelectItem
                                  key={method.value}
                                  value={method.value}
                                >
                                  {method.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register(`payments.${index}.amount`)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Data do Pagamento</Label>
                    <Input
                      type="date"
                      {...register(`payments.${index}.paymentDate`)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Data em que o pagamento foi realizado
                    </p>
                  </div>

                  {canHaveInstallments(watch(`payments.${index}.method`)) && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Controller
                          control={control}
                          name={`payments.${index}.hasInstallments`}
                          render={({ field }) => (
                            <Checkbox
                              id={`installments-${index}`}
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                        <Label
                          htmlFor={`installments-${index}`}
                          className="cursor-pointer"
                        >
                          Parcelar este pagamento
                        </Label>
                      </div>

                      {watch(`payments.${index}.hasInstallments`) && (
                        <div className="space-y-2 border-l-2 border-primary/20 pl-6">
                          <Label>Número de Parcelas</Label>
                          <Input
                            type="number"
                            min="2"
                            max="24"
                            {...register(`payments.${index}.installmentsCount`)}
                            placeholder="6"
                          />
                          {watch(`payments.${index}.installmentsCount`) &&
                            watch(`payments.${index}.installmentsCount`)! > 1 &&
                            watch(`payments.${index}.amount`) &&
                            watch(`payments.${index}.amount`)! > 0 && (
                              <p className="text-sm text-muted-foreground">
                                {watch(`payments.${index}.installmentsCount`)}x
                                de{" "}
                                {formatCurrency(
                                  watch(`payments.${index}.amount`)! /
                                    watch(
                                      `payments.${index}.installmentsCount`,
                                    )!,
                                )}
                              </p>
                            )}
                        </div>
                      )}
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>Observações do Pagamento</Label>
                    <Textarea
                      {...register(`payments.${index}.obs`)}
                      placeholder="Observações sobre este pagamento"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* General Observations */}
            <div className="space-y-2">
              <Label htmlFor="obs">Observações Gerais</Label>
              <Textarea
                {...register("obs")}
                placeholder="Observações sobre a venda"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            {items.length === 0 ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button type="button" disabled={true}>
                        Registrar Venda
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Adicione pelo menos um serviço para continuar</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Registrar Venda"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
