import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, X } from "lucide-react";

import { FormInput } from "@/components/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/infra/firebase/hooks";
import { useFetchSettingsQuery } from "@/app/state/features/settingsSlice";
import { useAddCustomerFinanceMutation } from "@/app/state/features/customerFinancesSlice";
import { useToast } from "@/components/ui/use-toast";
import { IServiceConfig, IAllSettings } from "@/domain/entities/settings";
import { IFinanceItem, PAYMENT_METHODS } from "@/domain/entities/finances";

const financeSchema = z.object({
  discount: z.coerce.number().min(0).optional(),
  obs: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentAmount: z.coerce.number().min(0).optional(),
  paymentObs: z.string().optional(),
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
    formState: { errors, isSubmitting },
  } = useForm<FinanceFormInputs>({
    resolver: zodResolver(financeSchema),
    defaultValues: {
      discount: 0,
      obs: "",
      paymentMethod: "",
      paymentAmount: 0,
      paymentObs: "",
    },
  });

  // Get all active services
  const allServices: Record<string, IServiceConfig> = {
    ...settings?.default?.services,
    ...settings?.custom?.services,
  };

  const activeServices = Object.entries(allServices).filter(
    ([_, service]) => service.active
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
      })
    );

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = watch("discount") || 0;
    const total = Math.max(0, subtotal - discount);
    const creditsGranted = items.reduce((sum, item) => sum + item.credits, 0);

    return { items, subtotal, discount, total, creditsGranted };
  };

  const { items, subtotal, discount, total, creditsGranted } = calculateTotals();

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

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedServices({});
      reset();
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

      const paymentAmount = data.paymentAmount || 0;
      const pago = paymentAmount;
      const saldo = total - pago;

      let status: "pending" | "partial" | "paid" = "pending";
      if (pago >= total) status = "paid";
      else if (pago > 0) status = "partial";

      const payments =
        paymentAmount > 0 && data.paymentMethod
          ? [
              {
                createdAt: new Date().toISOString(),
                method: data.paymentMethod,
                obs: data.paymentObs,
                valor: paymentAmount,
              },
            ]
          : undefined;

      await addCustomerFinance({
        uid: dbUid!,
        customerId,
        finance: {
          customerId,
          items,
          subtotal,
          discount: data.discount,
          total,
          pago,
          saldo,
          creditsGranted,
          status,
          obs: data.obs,
          payments,
          createdAt: new Date().toISOString(),
        },
      }).unwrap();

      toast({
        title: "Venda registrada",
        description: `Venda de ${formatCurrency(total)} criada com sucesso.${
          creditsGranted > 0 ? ` ${creditsGranted} crédito(s) adicionado(s).` : ""
        }`,
      });

      setIsOpen(false);
    } catch (error) {
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Nova Venda</DialogTitle>
            <DialogDescription>Registrar uma nova venda para o cliente</DialogDescription>
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
                      {service.credits && service.credits > 0 && ` (${service.credits} crédito${service.credits > 1 ? "s" : ""})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Services List */}
            {Object.keys(selectedServices).length > 0 && (
              <div className="space-y-2">
                <Label>Serviços Adicionados</Label>
                <div className="border rounded-lg divide-y">
                  {Object.entries(selectedServices).map(([serviceId, { service, quantity }]) => (
                    <div key={serviceId} className="p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(service.price)} x {quantity} = {formatCurrency(service.price * quantity)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => updateQuantity(serviceId, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 border rounded text-center"
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
                  ))}
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
                  <FormInput
                    type="number"
                    name="discount"
                    placeholder="0.00"
                    register={register}
                    errors={errors}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total</Label>
                  <div className="h-10 px-3 flex items-center border rounded-md bg-muted font-bold text-lg">
                    {formatCurrency(total)}
                  </div>
                </div>
              </div>

              {creditsGranted > 0 && (
                <div className="text-sm text-muted-foreground">
                  Esta venda concederá {creditsGranted} crédito{creditsGranted > 1 ? "s" : ""} ao cliente
                </div>
              )}
            </div>

            <Separator />

            {/* Payment */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Pagamento (Opcional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                  <Controller
                    control={control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentAmount">Valor Pago (R$)</Label>
                  <FormInput
                    type="number"
                    name="paymentAmount"
                    placeholder="0.00"
                    register={register}
                    errors={errors}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentObs">Observações do Pagamento</Label>
                <FormInput
                  type="textarea"
                  name="paymentObs"
                  placeholder="Observações sobre o pagamento"
                  register={register}
                  errors={errors}
                />
              </div>
            </div>

            {/* General Observations */}
            <div className="space-y-2">
              <Label htmlFor="obs">Observações Gerais</Label>
              <FormInput
                type="textarea"
                name="obs"
                placeholder="Observações sobre a venda"
                register={register}
                errors={errors}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || items.length === 0}>
              {isSubmitting ? "Salvando..." : "Registrar Venda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
