import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { useAddPaymentToFinanceMutation } from "@/app/state/features/paymentsSlice";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  INSTALLMENT_ENABLED_METHODS,
  PAYMENT_METHODS,
} from "@/domain/entities/finances";
import { useAuth } from "@/infra/firebase/hooks";
import { calculateInstallmentDueDate, formatDateForInput } from "@/lib/utils";

const paymentSchema = z
  .object({
    method: z.string().min(1, "Selecione um método de pagamento"),
    paymentDate: z.string().optional(),
    amount: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
    obs: z.string().optional(),
    hasInstallments: z.boolean().default(false),
    installmentsCount: z.coerce.number().optional(),
  })
  .refine(
    (data) => {
      // Only validate installmentsCount if hasInstallments is true
      if (data.hasInstallments) {
        return (
          data.installmentsCount !== undefined &&
          data.installmentsCount >= 2 &&
          data.installmentsCount <= 24
        );
      }
      return true;
    },
    {
      message: "Número de parcelas deve ser entre 2 e 24",
      path: ["installmentsCount"],
    }
  );

type PaymentFormInputs = z.infer<typeof paymentSchema>;

interface AddPaymentDialogProps {
  financeId: string;
  customerId: string;
  remainingBalance: number;
  trigger?: React.ReactNode;
}

export const AddPaymentDialog = ({
  financeId,
  customerId,
  remainingBalance,
  trigger,
}: AddPaymentDialogProps) => {
  const { dbUid } = useAuth();
  const { toast } = useToast();
  const [addPayment, { isLoading: isSavingPayment }] = useAddPaymentToFinanceMutation();
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    control,
    reset,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormInputs>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      method: "",
      paymentDate: formatDateForInput(),
      amount: remainingBalance,
      obs: "",
      hasInstallments: false,
      installmentsCount: 1,
    },
  });

  const hasInstallments = watch("hasInstallments");
  const installmentsCount = watch("installmentsCount");
  const amount = watch("amount");

  const paymentMethod = watch("method");

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
        reset({
          method: "",
          paymentDate: formatDateForInput(),
          amount: remainingBalance,
          obs: "",
          hasInstallments: false,
          installmentsCount: 1,
        });
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, reset, remainingBalance]);

  const onSubmit = async (data: PaymentFormInputs) => {
    try {
      // Build payment object
      const payment = {
        financeId,
        customerId,
        createdAt: data.paymentDate
          ? new Date(data.paymentDate).toISOString()
          : new Date().toISOString(),
        method: data.method,
        valor: data.amount,
        obs: data.obs,
        hasInstallments: data.hasInstallments,
        installmentsCount: data.hasInstallments
          ? data.installmentsCount
          : undefined,
      };

      // Build installments if needed
      let installments;
      if (
        data.hasInstallments &&
        data.installmentsCount &&
        data.installmentsCount > 1
      ) {
        const installmentAmount = data.amount / data.installmentsCount;
        const paymentDate = data.paymentDate
          ? new Date(data.paymentDate)
          : new Date();

        installments = Array.from(
          { length: data.installmentsCount },
          (_, i) => {
            const dueDate = calculateInstallmentDueDate(paymentDate, i);

            return {
              financeId,
              customerId,
              installmentNumber: i + 1,
              valor: installmentAmount,
              dueDate: dueDate.toISOString(),
              status: "pending" as const,
            };
          },
        );
      }

      await addPayment({
        uid: dbUid!,
        payment,
        installments,
      }).unwrap();

      toast({
        title: "Pagamento registrado",
        description: `Pagamento de ${formatCurrency(data.amount)} adicionado com sucesso.`,
      });

      setIsOpen(false);
    } catch (error) {
      console.error("Payment mutation error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Pagamento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Adicionar Pagamento</DialogTitle>
            <DialogDescription>
              Registrar um novo pagamento para esta venda
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Remaining Balance Info */}
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Saldo Restante:</span>
                <span className="text-lg font-bold">
                  {formatCurrency(remainingBalance)}
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="method">Método de Pagamento *</Label>
              <Controller
                control={control}
                name="method"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o método" />
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
              {errors.method && (
                <p className="text-sm text-destructive">
                  {errors.method.message}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("amount")}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label>Data do Pagamento</Label>
              <Input type="date" {...register("paymentDate")} />
              <p className="text-xs text-muted-foreground">
                Data em que o pagamento foi realizado
              </p>
            </div>

            {/* Installments Section - Only for eligible payment methods */}
            {canHaveInstallments(paymentMethod) && (
              <>
                {/* Installments Checkbox */}
                <div className="flex items-center space-x-2">
                  <Controller
                    control={control}
                    name="hasInstallments"
                    render={({ field }) => (
                      <Checkbox
                        id="hasInstallments"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="hasInstallments" className="cursor-pointer">
                    Parcelar este pagamento
                  </Label>
                </div>

                {/* Installments Count */}
                {hasInstallments && (
                  <div className="space-y-2 border-l-2 border-primary/20 pl-6">
                    <Label htmlFor="installmentsCount">
                      Número de Parcelas
                    </Label>
                    <Input
                      type="number"
                      min="2"
                      max="24"
                      {...register("installmentsCount")}
                      placeholder="6"
                    />
                    {errors.installmentsCount && (
                      <p className="text-sm text-destructive">
                        {errors.installmentsCount.message}
                      </p>
                    )}
                    {installmentsCount &&
                      installmentsCount > 1 &&
                      amount &&
                      amount > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {installmentsCount}x de{" "}
                          {formatCurrency(amount / installmentsCount)}
                        </p>
                      )}
                  </div>
                )}
              </>
            )}

            {/* Observations */}
            <div className="space-y-2">
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                {...register("obs")}
                placeholder="Observações sobre este pagamento"
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
            <Button
              type="submit"
              disabled={isSubmitting || isSavingPayment}
            >
              {isSubmitting || isSavingPayment ? "Salvando..." : "Adicionar Pagamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
