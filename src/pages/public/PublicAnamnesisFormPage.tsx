import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

import { PublicFormService } from "@/app/services/PublicFormService";
import { IPublicFormConfiguration } from "@/domain/entities/formSubmission";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PhotoUploadSection } from "@/components/FormSubmissions/PhotoUploadSection";

/**
 * Validation schema for customer data
 */
const customerDataSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  cpf: z.string().min(11, "CPF inválido").max(14),
  gender: z.enum(["H", "M"], { required_error: "Gênero é obrigatório" }),
  birthday: z.string().min(1, "Data de nascimento é obrigatória"),
  occupation: z.string().optional(),
  instagram: z.string().optional(),
  cameBy: z.string().optional(),
});

type CustomerData = z.infer<typeof customerDataSchema>;

export default function PublicAnamnesisFormPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [formConfig, setFormConfig] = useState<IPublicFormConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anamnesisData, setAnamnesisData] = useState<Record<string, string | string[]>>({});
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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerData>({
    resolver: zodResolver(customerDataSchema),
  });

  const selectedGender = watch("gender");

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

  // Filter anamnesis fields based on gender and enabled fields
  const filteredAnamnesisFields = formConfig
    ? Object.entries(formConfig.anamnesisFields || {})
        .filter(([fieldId]) => formConfig.enabledFields.includes(fieldId))
        .filter(([, field]: [string, any]) => {
          if (!field.gender) return true;
          if (field.gender === "B") return true;
          return field.gender === selectedGender;
        })
    : [];

  const onSubmit = async (customerData: CustomerData) => {
    if (!token || !formConfig) return;

    setSubmitting(true);
    try {
      // Only include evaluation data if any fields are enabled
      const hasEvaluationData =
        formConfig.enabledEvaluationFields &&
        (formConfig.enabledEvaluationFields.weight ||
          formConfig.enabledEvaluationFields.height ||
          (formConfig.enabledEvaluationFields.measures && formConfig.enabledEvaluationFields.measures.length > 0));

      await PublicFormService.submitForm(token, {
        customerData,
        anamnesisData,
        evaluationData: hasEvaluationData ? evaluationData : undefined,
      });

      setSubmitted(true);
      toast.success(formConfig.successMessage || "Formulário enviado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar formulário");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnamnesisFieldChange = (fieldId: string, value: string | string[]) => {
    setAnamnesisData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handlePhotosChange = (photos: { front?: string; back?: string; side?: string }) => {
    setEvaluationData((prev) => ({
      ...prev,
      photos,
    }));
  };

  const renderAnamnesisField = (fieldId: string, field: any) => {
    const fieldValue = anamnesisData[fieldId] || "";

    switch (field.type) {
      case "text":
      case "email":
      case "number":
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {formConfig?.requireAllFields && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldId}
              type={field.type}
              placeholder={field.placeholder}
              value={fieldValue as string}
              onChange={(e) => handleAnamnesisFieldChange(fieldId, e.target.value)}
              required={formConfig?.requireAllFields}
            />
          </div>
        );

      case "textarea":
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {formConfig?.requireAllFields && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldId}
              placeholder={field.placeholder}
              value={fieldValue as string}
              onChange={(e) => handleAnamnesisFieldChange(fieldId, e.target.value)}
              required={formConfig?.requireAllFields}
              rows={4}
            />
          </div>
        );

      case "select":
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {formConfig?.requireAllFields && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={fieldValue as string}
              onValueChange={(value) => handleAnamnesisFieldChange(fieldId, value)}
              required={formConfig?.requireAllFields}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || "Selecione..."} />
              </SelectTrigger>
              <SelectContent>
                {field.options &&
                  Object.entries(field.options).map(([key, label]: [string, any]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "radio":
        return (
          <div key={fieldId} className="space-y-2">
            <Label>
              {field.label}
              {formConfig?.requireAllFields && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup
              value={fieldValue as string}
              onValueChange={(value) => handleAnamnesisFieldChange(fieldId, value)}
              required={formConfig?.requireAllFields}
            >
              {field.options &&
                Object.entries(field.options).map(([key, label]: [string, any]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <RadioGroupItem value={key} id={`${fieldId}-${key}`} />
                    <Label htmlFor={`${fieldId}-${key}`} className="font-normal">
                      {label}
                    </Label>
                  </div>
                ))}
            </RadioGroup>
          </div>
        );

      default:
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !formConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error || "Formulário não encontrado"}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle>Formulário Enviado!</CardTitle>
            <CardDescription>{formConfig.successMessage}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              {formConfig.professionalName} receberá suas informações e entrará em contato em breve.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Form state
  const appointmentTypeLabel = formConfig.appointmentType === "online" ? "Online" : "Presencial";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl">{formConfig.professionalName}</CardTitle>
              <CardDescription className="text-base mt-2">
                {formConfig.customMessage || `Formulário de Anamnese - Consulta ${appointmentTypeLabel}`}
              </CardDescription>
            </div>
            {/* Logo placeholder - Professional can customize via settings */}
            <div className="flex-shrink-0 w-24 h-24 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            { formConfig.logo === ""
            ? <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {formConfig.professionalName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">Logo</div>
              </div>
            : <img alt="logo nutri office" src={formConfig.logo} />
            }
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  1
                </div>
                <span className="hidden sm:inline">Dados Pessoais</span>
              </div>
              <div className="w-8 h-0.5 bg-border"></div>
              {formConfig && formConfig.enabledFields && formConfig.enabledFields.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-semibold">
                      2
                    </div>
                    <span className="hidden sm:inline">Anamnese</span>
                  </div>
                  <div className="w-8 h-0.5 bg-border"></div>
                </>
              )}
              {formConfig?.enabledEvaluationFields &&
                (formConfig.enabledEvaluationFields.weight ||
                  formConfig.enabledEvaluationFields.height ||
                  (formConfig.enabledEvaluationFields.measures && formConfig.enabledEvaluationFields.measures.length > 0)) && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-semibold">
                      {formConfig && formConfig.enabledFields && formConfig.enabledFields.length > 0 ? "3" : "2"}
                    </div>
                    <span className="hidden sm:inline">Avaliação</span>
                  </div>
                )}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Section 1: Customer Data */}
            <div className="space-y-4 bg-muted/30 p-6 rounded-lg border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold">Dados Pessoais</h3>
                  <p className="text-sm text-muted-foreground">Preencha suas informações básicas</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nome Completo <span className="text-red-500">*</span>
                  </Label>
                  <Input id="name" {...register("name")} placeholder="Seu nome completo" />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input id="email" type="email" {...register("email")} placeholder="seu@email.com" />
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Telefone/WhatsApp <span className="text-red-500">*</span>
                  </Label>
                  <Input id="phone" {...register("phone")} placeholder="(00) 00000-0000" />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">
                    CPF <span className="text-red-500">*</span>
                  </Label>
                  <Input id="cpf" {...register("cpf")} placeholder="000.000.000-00" />
                  {errors.cpf && <p className="text-sm text-red-500">{errors.cpf.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">
                    Gênero <span className="text-red-500">*</span>
                  </Label>
                  <Select onValueChange={(value: "H" | "M") => setValue("gender", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="H">Masculino</SelectItem>
                      <SelectItem value="M">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-sm text-red-500">{errors.gender.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthday">
                    Data de Nascimento <span className="text-red-500">*</span>
                  </Label>
                  <Input id="birthday" type="date" {...register("birthday")} />
                  {errors.birthday && <p className="text-sm text-red-500">{errors.birthday.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Profissão</Label>
                  <Input id="occupation" {...register("occupation")} placeholder="Sua profissão" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input id="instagram" {...register("instagram")} placeholder="@seu_instagram" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cameBy">Como conheceu nosso trabalho?</Label>
                  <Input id="cameBy" {...register("cameBy")} placeholder="Indicação, redes sociais, etc." />
                </div>
              </div>
            </div>

            {/* Section 2: Anamnesis */}
            {formConfig && formConfig.enabledFields && formConfig.enabledFields.length > 0 && (
              <div className="space-y-4 bg-muted/30 p-6 rounded-lg border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Anamnese</h3>
                    <p className="text-sm text-muted-foreground">Histórico de saúde e hábitos alimentares</p>
                  </div>
                </div>

                {filteredAnamnesisFields.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">{filteredAnamnesisFields.map(([fieldId, field]) => renderAnamnesisField(fieldId, field))}</div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      Os campos de anamnese serão exibidos após você selecionar seu gênero acima.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Section 3: Evaluation */}
            {formConfig?.enabledEvaluationFields &&
              (formConfig.enabledEvaluationFields.weight ||
                formConfig.enabledEvaluationFields.height ||
                (formConfig.enabledEvaluationFields.measures && formConfig.enabledEvaluationFields.measures.length > 0)) && (
                <div className="space-y-4 bg-muted/30 p-6 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                      {formConfig && formConfig.enabledFields && formConfig.enabledFields.length > 0 ? "3" : "2"}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Dados de Avaliação</h3>
                      <p className="text-sm text-muted-foreground">Medidas corporais e informações físicas</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formConfig.enabledEvaluationFields.weight && (
                      <div className="space-y-2">
                        <Label htmlFor="eval-weight">Peso (kg)</Label>
                        <Input
                          id="eval-weight"
                          type="number"
                          step="0.1"
                          placeholder="Ex: 70.5"
                          value={evaluationData.weight || ""}
                          onChange={(e) =>
                            setEvaluationData((prev) => ({
                              ...prev,
                              weight: e.target.value ? parseFloat(e.target.value) : undefined,
                            }))
                          }
                        />
                      </div>
                    )}

                    {formConfig.enabledEvaluationFields.height && (
                      <div className="space-y-2">
                        <Label htmlFor="eval-height">Altura (cm)</Label>
                        <Input
                          id="eval-height"
                          type="number"
                          step="0.1"
                          placeholder="Ex: 170"
                          value={evaluationData.height || ""}
                          onChange={(e) =>
                            setEvaluationData((prev) => ({
                              ...prev,
                              height: e.target.value ? parseFloat(e.target.value) : undefined,
                            }))
                          }
                        />
                      </div>
                    )}

                    {formConfig.enabledEvaluationFields.measures &&
                      formConfig.enabledEvaluationFields.measures.length > 0 && (
                        <>
                          <div className="md:col-span-2">
                            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Medidas Circunferenciais (cm)</h4>
                          </div>
                          {formConfig.enabledEvaluationFields.measures.map((measurePoint) => (
                            <div key={measurePoint.id} className="space-y-2">
                              <Label htmlFor={`measure-${measurePoint.id}`}>
                                {measurePoint.label}
                              </Label>
                              <Input
                                id={`measure-${measurePoint.id}`}
                                type="number"
                                step="0.1"
                                placeholder="Ex: 85"
                                value={evaluationData.measures?.[measurePoint.id] || ""}
                                onChange={(e) => {
                                  const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                  setEvaluationData((prev) => {
                                    const updatedMeasures = { ...prev.measures };
                                    if (value !== undefined) {
                                      updatedMeasures[measurePoint.id] = value;
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
                          ))}
                        </>
                      )}

                    {/* Photo Upload Section */}
                    {formConfig.enabledEvaluationFields.photos && (
                      <>
                        <div className="md:col-span-2 mt-4">
                          <Separator className="mb-4" />
                        </div>
                        <div className="md:col-span-2">
                          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                            Fotos de Evolução (Opcional)
                          </h4>
                          <p className="text-xs text-muted-foreground mb-4">
                            Envie fotos nas posições indicadas para melhor acompanhamento
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

            {/* Submit Button */}
            <div className="flex flex-col items-center gap-4 pt-6">
              <Button type="submit" disabled={submitting} size="lg" className="w-full md:w-auto min-w-[200px]">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Formulário"
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Ao enviar, {formConfig.professionalName} receberá suas informações e entrará em contato em breve.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
