import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { PublicFormService } from "@/app/services/PublicFormService";
import { FileUploadSection } from "@/components/FormSubmissions/FileUploadSection";
import { PhotoUploadSection } from "@/components/FormSubmissions/PhotoUploadSection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/masked-input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { IPublicFormConfiguration } from "@/domain/entities/formSubmission";

const COUNTRY_CODES = [
  { code: "BR", label: "Brasil (+55)", dialCode: "+55" },
  { code: "US", label: "EUA (+1)", dialCode: "+1" },
  { code: "PT", label: "Portugal (+351)", dialCode: "+351" },
  { code: "AR", label: "Argentina (+54)", dialCode: "+54" },
  { code: "UY", label: "Uruguai (+598)", dialCode: "+598" },
  { code: "PY", label: "Paraguai (+595)", dialCode: "+595" },
  { code: "CL", label: "Chile (+56)", dialCode: "+56" },
  { code: "CO", label: "Colômbia (+57)", dialCode: "+57" },
  { code: "MX", label: "México (+52)", dialCode: "+52" },
  { code: "ES", label: "Espanha (+34)", dialCode: "+34" },
  { code: "IT", label: "Itália (+39)", dialCode: "+39" },
  { code: "DE", label: "Alemanha (+49)", dialCode: "+49" },
  { code: "FR", label: "França (+33)", dialCode: "+33" },
  { code: "GB", label: "Reino Unido (+44)", dialCode: "+44" },
  { code: "OTHER", label: "Outro", dialCode: "" },
];

/**
 * Validation schema for customer data
 */
const customerDataSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  countryCode: z.string().default("BR"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  cpf: z.string().min(14, "CPF inválido").max(14, "CPF inválido"),
  gender: z.enum(["H", "M"], { required_error: "Gênero é obrigatório" }),
  birthday: z.string().min(1, "Data de nascimento é obrigatória"),
  occupation: z.string().optional(),
  instagram: z.string().optional(),
  cameBy: z.string().optional(),
  street: z.string().min(1, "Endereço é obrigatório"),
  district: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade/Estado é obrigatório"),
  cep: z.string().min(9, "CEP inválido").max(9, "CEP inválido"),
});

const reavaliacaoCustomerDataSchema = customerDataSchema.partial().extend({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
});

type CustomerData = z.infer<typeof customerDataSchema>;

export default function PublicAnamnesisFormPage() {
  const { token } = useParams<{ token: string }>();

  const [formConfig, setFormConfig] = useState<IPublicFormConfiguration | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anamnesisData, setAnamnesisData] = useState<
    Record<string, string | string[]>
  >({});
  const [evaluationData, setEvaluationData] = useState<{
    weight?: number;
    height?: number;
    measures?: Record<string, number>;
    photos?: {
      front?: string;
      back?: string;
      side?: string;
    };
  }>({});
  const [feedingHistory, setFeedingHistory] = useState<Array<{ time: string; meal: string }>>([]);
  const [attachments, setAttachments] = useState<Array<{ filename: string; originalName: string; url: string; size: number }>>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<CustomerData>({
    defaultValues: { countryCode: "BR" },
    resolver: (data, ctx, options) => {
      const isReavaliacao = formConfig?.appointmentType === "reavaliacao";
      const schema = isReavaliacao ? reavaliacaoCustomerDataSchema : customerDataSchema;
      return zodResolver(schema)(data, ctx, options);
    },
  });

  const selectedGender = watch("gender");
  const selectedCountryCode = watch("countryCode") ?? "BR";

  // Load form configuration
  useEffect(() => {
    if (!token) {
      setError("Token inválido");
      setLoading(false);
      return;
    }

    PublicFormService.getFormByToken(token)
      .then((config) => {
        setFormConfig(config);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Falha ao carregar formulário");
        setLoading(false);
      });
  }, [token]);

  const hasAnamnesisSection = (formConfig?.enabledFields?.length ?? 0) > 0;
  const hasEvaluationSection = !!(
    formConfig?.enabledEvaluationFields &&
    (formConfig.enabledEvaluationFields.weight ||
      formConfig.enabledEvaluationFields.height ||
      (formConfig.enabledEvaluationFields.measures?.length ?? 0) > 0 ||
      formConfig.enabledEvaluationFields.photos)
  );
  const hasFeedingHistorySection = formConfig?.enableFeedingHistory

  const hasAttachmentsSection = formConfig?.enableAttachments;

  const anamnesisNum = 2;
  const feedingHistoryNum = hasAnamnesisSection ? 3 : 2;
  const evaluationNum = 2 + (hasAnamnesisSection ? 1 : 0) + (hasFeedingHistorySection ? 1 : 0);
  const attachmentsNum = evaluationNum + (hasEvaluationSection ? 1 : 0);

  // Filter and sort anamnesis fields based on gender, enabled fields, and order property
  const filteredAnamnesisFields = formConfig
    ? Object.entries(formConfig.anamnesisFields || {})
        .filter(([fieldId]) => formConfig.enabledFields.includes(fieldId))
        .filter(([, field]) => {
          if (!field.gender) return true;
          if (field.gender === "B") return true;
          return field.gender === selectedGender;
        })
        .sort(([idA], [idB]) => {
          return formConfig.enabledFields.indexOf(idA) - formConfig.enabledFields.indexOf(idB);
        })
    : [];

  const onSubmit = async (customerData: CustomerData) => {
    if (!token || !formConfig) return;

    // Prepend dial code to phone if country is not "OTHER" and code not already present
    const country = COUNTRY_CODES.find((c) => c.code === (customerData.countryCode ?? "BR"));
    if (country && country.dialCode && !customerData.phone.startsWith(country.dialCode)) {
      customerData = { ...customerData, phone: `${country.dialCode}${customerData.phone}` };
    }

    // Collect all validation errors before showing feedback
    const errors: string[] = [];

    // Validate required anamnesis fields
    for (const [fieldId, field] of filteredAnamnesisFields) {
      const isFieldRequired = formConfig?.requireAllFields || !!(field as Record<string, unknown> & { rules?: { required?: boolean } })?.rules?.required;
      if (isFieldRequired) {
        const value = anamnesisData[fieldId];
        const isEmpty = !value || (Array.isArray(value) ? value.length === 0 : String(value).trim() === "");
        if (isEmpty) {
          errors.push(String((field as Record<string, unknown>).label));
        }
      }
    }

    // Validate evaluation fields when section is enabled — all are mandatory
    const ef = formConfig.enabledEvaluationFields;
    if (ef) {
      if (ef.weight && !evaluationData.weight) errors.push("Peso");
      if (ef.height && !evaluationData.height) errors.push("Altura");
      if (ef.measures && ef.measures.length > 0) {
        for (const m of ef.measures) {
          if (!evaluationData.measures?.[m.id]) errors.push(m.label);
        }
      }
      if (ef.photos) {
        const uploadedCount = Object.keys(evaluationData.photos || {}).length;
        if (uploadedCount < 3) errors.push("Fotos (Frente, Costas e Lado)");
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setTimeout(() => errorSummaryRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      return;
    }
    setValidationErrors([]);

    setSubmitting(true);
    try {
      // Only include evaluation data if any fields are enabled
      const hasEvaluationData =
        formConfig.enabledEvaluationFields &&
        (formConfig.enabledEvaluationFields.weight ||
          formConfig.enabledEvaluationFields.height ||
          (formConfig.enabledEvaluationFields.measures &&
            formConfig.enabledEvaluationFields.measures.length > 0));

      await PublicFormService.submitForm(token, {
        customerData,
        anamnesisData,
        evaluationData: hasEvaluationData ? evaluationData : undefined,
        feedingHistory: formConfig.enableFeedingHistory && feedingHistory.length > 0 ? feedingHistory : undefined,
        attachments: formConfig.enableAttachments && attachments.length > 0 ? attachments : undefined,
      });

      setSubmitted(true);
      toast.success(
        formConfig.successMessage || "Formulário enviado com sucesso!",
      );
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : "Erro ao enviar formulário";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnamnesisFieldChange = (
    fieldId: string,
    value: string | string[],
  ) => {
    setAnamnesisData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handlePhotosChange = useCallback((photos: {
    front?: string;
    back?: string;
    side?: string;
  }) => {
    setEvaluationData((prev) => ({
      ...prev,
      photos,
    }));
  }, []);

  const renderAnamnesisField = (
    fieldId: string,
    field: Record<string, unknown>,
  ) => {
    const fieldValue = anamnesisData[fieldId] || "";
    const fieldType = String(field.type || "text");
    const fieldLabel = String(field.label || "");
    const fieldPlaceholder = String(field.placeholder || "");
    const isRequired = formConfig?.requireAllFields || !!(field.rules as Record<string, unknown> | undefined)?.required;

    switch (fieldType) {
      case "text":
      case "email":
      case "number":
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {fieldLabel}
              {isRequired && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </Label>
            <Input
              id={fieldId}
              type={fieldType}
              placeholder={fieldPlaceholder}
              value={fieldValue as string}
              onChange={(e) =>
                handleAnamnesisFieldChange(fieldId, e.target.value)
              }
              required={isRequired}
            />
          </div>
        );

      case "textarea":
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {fieldLabel}
              {isRequired && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </Label>
            <Textarea
              id={fieldId}
              placeholder={fieldPlaceholder}
              value={fieldValue as string}
              onChange={(e) =>
                handleAnamnesisFieldChange(fieldId, e.target.value)
              }
              required={isRequired}
              rows={4}
            />
          </div>
        );

      case "select":
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {fieldLabel}
              {isRequired && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </Label>
            <select
              id={fieldId}
              value={fieldValue as string}
              onChange={(e) => handleAnamnesisFieldChange(fieldId, e.target.value)}
              required={isRequired}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="" disabled>{fieldPlaceholder || "Selecione..."}</option>
              {field.options && typeof field.options === "object"
                ? Object.entries(field.options as Record<string, string>).map(
                    ([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ),
                  )
                : null}
            </select>
          </div>
        );

      case "radio":
        return (
          <div key={fieldId} className="space-y-2">
            <Label>
              {fieldLabel}
              {isRequired && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </Label>
            <div className="grid gap-2">
              {field.options && typeof field.options === "object"
                ? Object.entries(field.options as Record<string, string>).map(
                    ([key, label]) => (
                      <label
                        key={key}
                        htmlFor={`${fieldId}-${key}`}
                        className="flex cursor-pointer items-center gap-3 rounded-md border border-input bg-background px-4 py-3 text-sm transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                      >
                        <input
                          type="radio"
                          id={`${fieldId}-${key}`}
                          name={fieldId}
                          value={key}
                          checked={(fieldValue as string) === key}
                          onChange={() => handleAnamnesisFieldChange(fieldId, key)}
                          className="h-4 w-4 accent-primary"
                        />
                        {label}
                      </label>
                    ),
                  )
                : null}
            </div>
          </div>
        );

      case "multiple":
        return (
          <div key={fieldId} className="space-y-2">
            <Label>
              {fieldLabel}
              {isRequired && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </Label>
            <div className="space-y-2">
              {
                (field.options &&
                  typeof field.options === "object" &&
                  Object.entries(field.options as Record<string, string>).map(
                    ([key, label]) => {
                      const currentValues = Array.isArray(fieldValue)
                        ? fieldValue
                        : [];
                      const isChecked = currentValues.includes(key);

                      return (
                        <div key={key} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`${fieldId}-${key}`}
                            checked={isChecked}
                            onChange={(e) => {
                              let newValues: string[];
                              if (e.target.checked) {
                                newValues = [...currentValues, key];
                              } else {
                                newValues = currentValues.filter(
                                  (v) => v !== key,
                                );
                              }
                              handleAnamnesisFieldChange(fieldId, newValues);
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                          />
                          <Label
                            htmlFor={`${fieldId}-${key}`}
                            className="font-normal"
                          >
                            {label}
                          </Label>
                        </div>
                      );
                    },
                  )) as React.ReactNode
              }
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !formConfig) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {error || "Formulário não encontrado"}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <Card className="max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Tudo certo!</CardTitle>
            <CardDescription className="text-base">
              {formConfig.successMessage || "Suas respostas foram enviadas com sucesso!"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Suas respostas foram recebidas e já estão sendo analisadas por{" "}
              <span className="font-medium text-foreground">
                {formConfig.professionalName}
              </span>
              . Em breve você receberá seu plano alimentar e todas as
              orientações necessárias para dar início ao seu acompanhamento.
            </p>
            <p className="text-sm text-muted-foreground">
              Fique de olho nas suas mensagens — o contato será feito em breve.
              Obrigada pela confiança!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Form state
  const appointmentTypeLabel = () => {
    let label;
    switch (formConfig.appointmentType) {
      case "online": label = "Online";
      break;
      case "reavaliacao": label = "Reavaliação";
      break;
      case "presencial": label = "Presencial";
      break;
      case "consultoria": label = "Consultoria";
      break;
      case "hibrido": label = "Híbrido";
      break;
      default: label = "";
    }
    return label;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 py-8">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl">
                {formConfig.professionalName}
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                {formConfig.customMessage ||
                  `Formulário de Anamnese - Consulta ${appointmentTypeLabel()}`}
              </CardDescription>
            </div>
            {/* Logo placeholder - Professional can customize via settings */}
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
              {formConfig.logo === "" ? (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {formConfig.professionalName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    Logo
                  </div>
                </div>
              ) : (
                <img alt="logo nutri office" src={formConfig.logo} />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit, (fieldErrors) => {
            const labels: Record<string, string> = {
              name: "Nome", email: "Email", phone: "Telefone", cpf: "CPF",
              gender: "Gênero", birthday: "Data de nascimento",
              street: "Endereço", district: "Bairro", city: "Cidade/Estado", cep: "CEP",
            };
            const msgs = Object.keys(fieldErrors).map((k) => labels[k] ?? k);
            setValidationErrors(msgs);
            setTimeout(() => errorSummaryRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
          })} className="space-y-8">
            {/* Section 1: Customer Data */}
            <div className="space-y-4 rounded-lg border bg-muted/30 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {formConfig?.appointmentType === "reavaliacao"
                      ? "Identificação"
                      : "Dados Pessoais"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formConfig?.appointmentType === "reavaliacao"
                      ? "Para identificarmos seu cadastro"
                      : "Preencha suas informações básicas"}
                  </p>
                </div>
              </div>

              {formConfig?.appointmentType === "reavaliacao" ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nome Completo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="Seu nome completo"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Telefone/WhatsApp <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <select
                        value={selectedCountryCode}
                        onChange={(e) => setValue("countryCode", e.target.value)}
                        className="h-9 w-44 shrink-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                      </select>
                      {selectedCountryCode === "BR" ? (
                        <MaskedInput
                          id="phone"
                          mask="phone"
                          {...register("phone")}
                          placeholder="(00) 00000-0000"
                          className="flex-1"
                        />
                      ) : (
                        <Input
                          id="phone"
                          {...register("phone")}
                          placeholder="Número"
                          className="flex-1"
                        />
                      )}
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nome Completo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="Seu nome completo"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="seu@email.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Telefone/WhatsApp <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <select
                        value={selectedCountryCode}
                        onChange={(e) => setValue("countryCode", e.target.value)}
                        className="h-9 w-44 shrink-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                      </select>
                      {selectedCountryCode === "BR" ? (
                        <MaskedInput
                          id="phone"
                          mask="phone"
                          {...register("phone")}
                          placeholder="(00) 00000-0000"
                          className="flex-1"
                        />
                      ) : (
                        <Input
                          id="phone"
                          {...register("phone")}
                          placeholder="Número"
                          className="flex-1"
                        />
                      )}
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-red-500">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">
                      CPF <span className="text-red-500">*</span>
                    </Label>
                    <MaskedInput
                      id="cpf"
                      mask="cpf"
                      {...register("cpf")}
                      placeholder="000.000.000-00"
                    />
                    {errors.cpf && (
                      <p className="text-sm text-red-500">{errors.cpf.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">
                      Gênero <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="gender"
                      onChange={(e) => setValue("gender", e.target.value as "H" | "M")}
                      defaultValue=""
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="" disabled>Selecione...</option>
                      <option value="H">Masculino</option>
                      <option value="M">Feminino</option>
                    </select>
                    {errors.gender && (
                      <p className="text-sm text-red-500">
                        {errors.gender.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthday">
                      Data de Nascimento <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="birthday"
                      control={control}
                      render={({ field }) => (
                        <MaskedInput
                          id="birthday"
                          mask="date"
                          placeholder="DD/MM/AAAA"
                          value={
                            field.value && /^\d{4}-\d{2}-\d{2}$/.test(field.value)
                              ? `${field.value.slice(8, 10)}/${field.value.slice(5, 7)}/${field.value.slice(0, 4)}`
                              : field.value ?? ""
                          }
                          onChange={(e) => {
                            const raw = e.target.value;
                            const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
                            field.onChange(match ? `${match[3]}-${match[2]}-${match[1]}` : raw);
                          }}
                        />
                      )}
                    />
                    {errors.birthday && (
                      <p className="text-sm text-red-500">
                        {errors.birthday.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="occupation">Profissão</Label>
                    <Input
                      id="occupation"
                      {...register("occupation")}
                      placeholder="Sua profissão"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      {...register("instagram")}
                      placeholder="@seu_instagram"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="cameBy">Como conheceu nosso trabalho?</Label>
                    <Input
                      id="cameBy"
                      {...register("cameBy")}
                      placeholder="Indicação, redes sociais, etc."
                    />
                  </div>
                </div>

                {/* Address section — Brazil only, not for reavaliacao */}
                {selectedCountryCode === "BR" &&
                  (formConfig?.appointmentType === "online" ||
                    formConfig?.appointmentType === "presencial" ||
                    formConfig?.appointmentType === "consultoria" ||
                    formConfig?.appointmentType === "hibrido") && (
                  <>
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-base font-semibold">Endereço</h4>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Necessário para emissão de nota fiscal
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="street">
                          Endereço <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="street"
                          {...register("street")}
                          placeholder="Rua, número - complemento"
                        />
                        {errors.street && (
                          <p className="text-sm text-red-500">{errors.street.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="district">
                          Bairro <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="district"
                          {...register("district")}
                          placeholder="Bairro"
                        />
                        {errors.district && (
                          <p className="text-sm text-red-500">{errors.district.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cep">
                          CEP <span className="text-red-500">*</span>
                        </Label>
                        <MaskedInput
                          id="cep"
                          mask="cep"
                          {...register("cep")}
                          placeholder="Ex: 99040-150"
                        />
                        {errors.cep && (
                          <p className="text-sm text-red-500">{errors.cep.message}</p>
                        )}
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="city">
                          Cidade/Estado <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="city"
                          {...register("city")}
                          placeholder="Ex: Porto Alegre / RS"
                        />
                        {errors.city && (
                          <p className="text-sm text-red-500">{errors.city.message}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
                </>
              )}
            </div>

            {/* Section 2: Anamnesis */}
            {formConfig &&
              formConfig.enabledFields &&
              formConfig.enabledFields.length > 0 && (
                <div className="space-y-4 rounded-lg border bg-muted/30 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                      {anamnesisNum}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Anamnese</h3>
                      <p className="text-sm text-muted-foreground">
                        Histórico de saúde e hábitos alimentares
                      </p>
                    </div>
                  </div>

                  {filteredAnamnesisFields.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredAnamnesisFields.map(([fieldId, field]) =>
                        renderAnamnesisField(fieldId, field),
                      )}
                    </div>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        Os campos de anamnese serão exibidos após você
                        selecionar seu gênero acima.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            
            {/* Section 3: Feeding History (Recordatório Alimentar) */}
            {formConfig?.enableFeedingHistory && (
              <div className="space-y-4 rounded-lg border bg-muted/30 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {feedingHistoryNum}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Recordatório Alimentar</h3>
                    <p className="text-sm text-muted-foreground">
                      {formConfig?.appointmentType === "reavaliacao" ?
                      "Dentre as opções prescritas, descreva com detalhes quais você usou e os horários de cada refeição" :
                      "Informe sua rotina alimentar atual" }
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {feedingHistory.map((meal, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border bg-background p-3">
                      <div className="w-20 shrink-0">
                        <label className="mb-1 block text-xs text-muted-foreground">Horário</label>
                        <MaskedInput
                          mask="time"
                          value={meal.time}
                          placeholder="HH:MM"
                          onChange={(e) =>
                            setFeedingHistory((prev) =>
                              prev.map((m, idx) => idx === i ? { ...m, time: e.target.value } : m)
                            )
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <label className="mb-1 block text-xs text-muted-foreground">
                          {`Refeição ${i + 1}`}
                        </label>
                        <textarea
                          value={meal.meal}
                          onChange={(e) =>
                            setFeedingHistory((prev) =>
                              prev.map((m, idx) => idx === i ? { ...m, meal: e.target.value } : m)
                            )
                          }
                          placeholder="Descreva o que costuma comer nesta refeição..."
                          rows={2}
                          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFeedingHistory((prev) => prev.filter((_, idx) => idx !== i))}
                        className="mt-6 text-destructive hover:text-destructive/80 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setFeedingHistory((prev) => [...prev, { time: "", meal: "" }])}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-input bg-transparent px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus size={16} />
                  Adicionar Refeição
                </button>
              </div>
            )}

            {/* Section 4: Evaluation */}
            {formConfig?.enabledEvaluationFields &&
              (formConfig.enabledEvaluationFields.weight ||
                formConfig.enabledEvaluationFields.height ||
                (formConfig.enabledEvaluationFields.measures &&
                  formConfig.enabledEvaluationFields.measures.length > 0)) && (
                <div className="space-y-4 rounded-lg border bg-muted/30 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                      {evaluationNum}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Dados de Avaliação</h3>
                      <p className="text-sm text-muted-foreground">
                        Medidas corporais e informações físicas
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {formConfig.enabledEvaluationFields.weight && (
                      <div className="space-y-2">
                        <Label htmlFor="eval-weight">Peso (kg) <span className="text-red-500">*</span></Label>
                        <Input
                          id="eval-weight"
                          type="number"
                          step="0.1"
                          placeholder="Ex: 70.5"
                          value={evaluationData.weight || ""}
                          onChange={(e) =>
                            setEvaluationData((prev) => ({
                              ...prev,
                              weight: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            }))
                          }
                        />
                      </div>
                    )}

                    {formConfig.enabledEvaluationFields.height && (
                      <div className="space-y-2">
                        <Label htmlFor="eval-height">Altura (cm) <span className="text-red-500">*</span></Label>
                        <Input
                          id="eval-height"
                          type="number"
                          step="0.1"
                          placeholder="Ex: 170"
                          value={evaluationData.height || ""}
                          onChange={(e) =>
                            setEvaluationData((prev) => ({
                              ...prev,
                              height: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            }))
                          }
                        />
                      </div>
                    )}

                    {formConfig.enabledEvaluationFields.measures &&
                      formConfig.enabledEvaluationFields.measures.length >
                        0 && (
                        <>
                          <div className="md:col-span-2">
                            <h4 className="mb-3 text-sm font-medium text-muted-foreground">
                              Medidas Circunferenciais (cm)
                            </h4>
                          </div>
                          {formConfig.enabledEvaluationFields.measures.map(
                            (measurePoint) => (
                              <div key={measurePoint.id} className="space-y-2">
                                <Label htmlFor={`measure-${measurePoint.id}`}>
                                  {measurePoint.label} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id={`measure-${measurePoint.id}`}
                                  type="number"
                                  step="0.1"
                                  placeholder="Ex: 85"
                                  value={
                                    evaluationData.measures?.[
                                      measurePoint.id
                                    ] || ""
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value
                                      ? parseFloat(e.target.value)
                                      : undefined;
                                    setEvaluationData((prev) => {
                                      const updatedMeasures = {
                                        ...prev.measures,
                                      };
                                      if (value !== undefined) {
                                        updatedMeasures[measurePoint.id] =
                                          value;
                                      } else {
                                        delete updatedMeasures[measurePoint.id];
                                      }
                                      return {
                                        ...prev,
                                        measures: updatedMeasures,
                                      };
                                    });
                                  }}
                                />
                              </div>
                            ),
                          )}
                        </>
                      )}

                    {/* Photo Upload Section */}
                    {formConfig.enabledEvaluationFields.photos && (
                      <>
                        <div className="mt-4 md:col-span-2">
                          <Separator className="mb-4" />
                        </div>
                        <div className="md:col-span-2">
                          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                            Fotos de Evolução <span className="text-red-500">*</span>
                          </h4>
                          <p className="mb-4 text-xs text-muted-foreground">
                            Envie as 3 fotos obrigatórias: Frente, Costas e Lado
                          </p>
                          <PhotoUploadSection
                            positions={["front", "back", "side"]}
                            token={token!}
                            onPhotosChange={handlePhotosChange}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

            {/* Section: Extra Files (Attachments) */}
            {formConfig?.enableAttachments && (
              <div className="space-y-4 rounded-lg border bg-muted/30 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {attachmentsNum}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Arquivos Complementares</h3>
                    <p className="text-sm text-muted-foreground">
                      Envie exames, receitas médicas ou outros documentos relevantes (opcional)
                    </p>
                  </div>
                </div>
                <FileUploadSection
                  token={token!}
                  onFilesChange={setAttachments}
                />
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col items-center gap-4 pt-6">
              <Button
                type="submit"
                disabled={submitting}
                size="lg"
                className="w-full min-w-[200px] md:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Formulário"
                )}
              </Button>
              {validationErrors.length > 0 && (
                <div
                  ref={errorSummaryRef}
                  className="w-full rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <p className="mb-2 font-semibold">Preencha os campos obrigatórios antes de enviar:</p>
                  <ul className="list-inside list-disc space-y-1">
                    {validationErrors.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-center text-xs text-muted-foreground">
                Ao enviar, {formConfig.professionalName} receberá suas
                informações e entrará em contato em breve.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
