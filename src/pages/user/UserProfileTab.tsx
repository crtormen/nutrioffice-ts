import { zodResolver } from "@hookform/resolvers/zod";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  Award,
  Briefcase,
  Building2,
  Camera,
  Edit,
  FileText,
  Globe,
  Mail,
  MessageCircle,
  Phone,
  User,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  useFetchUserQuery,
  useUpdateUserMutation,
} from "@/app/state/features/userSlice";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ABILITIES, IUser } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";
import { storage } from "@/infra/firebase/firebaseConfig";
import { getInitials } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().min(2, "Informe pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z
    .string()
    .min(8, "Informe um telefone válido")
    .max(20, "Telefone muito longo")
    .optional()
    .or(z.literal("")),
  clinicName: z.string().max(80, "Máximo 80 caracteres").optional(),
  specialty: z.string().max(80, "Máximo 80 caracteres").optional(),
  licenseNumber: z.string().max(40, "Máximo 40 caracteres").optional(),
  bio: z.string().max(500, "Máximo 500 caracteres").optional(),
  website: z
    .string()
    .url("Informe uma URL válida (https://...)")
    .optional()
    .or(z.literal("")),
  whatsapp: z.string().max(20, "Máximo 20 caracteres").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFieldProps {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  href?: string;
}

const ProfileField = ({ icon, label, value, href }: ProfileFieldProps) => {
  const content = (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium leading-relaxed">
          {value || (
            <span className="text-muted-foreground">Não informado</span>
          )}
        </p>
      </div>
    </div>
  );

  if (href && value) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </a>
    );
  }

  return content;
};

const UserProfileTab = () => {
  const { dbUid, user: authUser } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { data: user, isLoading } = useFetchUserQuery(dbUid, { skip: !dbUid });
  const [updateUser, { isLoading: isSaving }] = useUpdateUserMutation();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || authUser?.displayName || "",
      email: user?.email || authUser?.email || "",
      phone: user?.phone || "",
      clinicName: user?.clinicName || "",
      specialty: user?.specialty || "",
      licenseNumber: user?.licenseNumber || "",
      bio: user?.bio || "",
      website: user?.website || "",
      whatsapp: user?.whatsapp || "",
    },
  });

  useEffect(() => {
    if (user || authUser) {
      form.reset({
        name: user?.name || authUser?.displayName || "",
        email: user?.email || authUser?.email || "",
        phone: user?.phone || "",
        clinicName: user?.clinicName || "",
        specialty: user?.specialty || "",
        licenseNumber: user?.licenseNumber || "",
        bio: user?.bio || "",
        website: user?.website || "",
        whatsapp: user?.whatsapp || "",
      });
    }
  }, [user, authUser, form]);

  const abilityLabel = useMemo(() => {
    const abilityKey = user?.roles?.ability;
    if (!abilityKey) return "Usuário";
    return ABILITIES[abilityKey]?.text || abilityKey;
  }, [user?.roles?.ability]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!dbUid) return;

    const payload: Partial<IUser> = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone?.trim() || "",
      clinicName: values.clinicName?.trim(),
      specialty: values.specialty?.trim(),
      licenseNumber: values.licenseNumber?.trim(),
      bio: values.bio?.trim(),
      website: values.website?.trim(),
      whatsapp: values.whatsapp?.trim(),
    };

    try {
      await updateUser({ uid: dbUid, updateData: payload }).unwrap();
      toast.success("Perfil atualizado com sucesso");
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível salvar os dados. Tente novamente.");
    }
  };

  const avatarSrc = user?.avatarUrl || authUser?.photoURL || "";

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Envie um arquivo de imagem válido.");
      return;
    }
    if (!dbUid) return;

    setIsUploadingAvatar(true);
    try {
      const avatarRef = ref(storage, `avatars/${dbUid}/profile`);
      await uploadBytes(avatarRef, file);
      const url = await getDownloadURL(avatarRef);
      await updateUser({ uid: dbUid, updateData: { avatarUrl: url } }).unwrap();
      toast.success("Foto atualizada com sucesso.");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível enviar a foto. Tente novamente.");
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  };

  if (isLoading || !user) {
    return <LoadingSpinner />;
  }

  const displayName = user?.name || authUser?.displayName || "Usuário";
  const email = user?.email || authUser?.email || "—";

  return (
    <div className="space-y-6">
      {/* Hero Card with Avatar and Quick Actions */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-background" />
        <CardContent className="relative -mt-16 space-y-6 pb-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
            {/* Avatar with Upload Button */}
            <div className="group relative">
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage src={avatarSrc} alt={displayName} />
                <AvatarFallback className="text-2xl font-semibold">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-10 w-10 rounded-full shadow-lg"
                disabled={isUploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            {/* Name, Role, and Actions */}
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div className="space-y-2">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
                  <h2 className="text-3xl font-bold tracking-tight">
                    {displayName}
                  </h2>
                  <Badge variant="secondary" className="text-sm">
                    {abilityLabel}
                  </Badge>
                </div>
                <p className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start">
                  <Mail className="h-4 w-4" />
                  {email}
                </p>
              </div>

              <div className="flex justify-center gap-2 sm:justify-start">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Perfil
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
                    <DialogHeader>
                      <DialogTitle>Editar perfil</DialogTitle>
                      <DialogDescription>
                        Atualize suas informações profissionais e de contato.
                      </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                      <form
                        className="space-y-4"
                        onSubmit={form.handleSubmit(onSubmit)}
                      >
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome completo *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Seu nome completo"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="seu@email.com"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefone</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="(xx) xxxxx-xxxx"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="whatsapp"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>WhatsApp</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="(xx) xxxxx-xxxx"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h4 className="text-sm font-medium">
                            Informações Profissionais
                          </h4>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="clinicName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome da clínica</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Ex: Vitalize Clinic"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="specialty"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Especialidade</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Ex: Nutrição esportiva"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="licenseNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Registro profissional (CRN)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ex: CRN 12345"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="website"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Website</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="https://seusite.com"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Separator />

                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sobre você</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Conte um pouco sobre sua atuação profissional..."
                                  className="min-h-[120px] resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <DialogFooter className="gap-2 sm:justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsDialogOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={isSaving}>
                            {isSaving ? "Salvando..." : "Salvar alterações"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio Card */}
      {user?.bio && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Sobre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {user.bio}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contact Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="h-5 w-5" />
            Informações de Contato
          </CardTitle>
          <CardDescription>
            Seus dados de contato e redes sociais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <ProfileField
              icon={<Phone className="h-4 w-4" />}
              label="Telefone"
              value={user?.phone}
              href={user?.phone ? `tel:${user.phone}` : undefined}
            />
            <ProfileField
              icon={<MessageCircle className="h-4 w-4" />}
              label="WhatsApp"
              value={user?.whatsapp}
              href={
                user?.whatsapp
                  ? `https://wa.me/${user.whatsapp.replace(/\D/g, "")}`
                  : undefined
              }
            />
            <ProfileField
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={email}
              href={`mailto:${email}`}
            />
            <ProfileField
              icon={<Globe className="h-4 w-4" />}
              label="Website"
              value={user?.website}
              href={user?.website}
            />
          </div>
        </CardContent>
      </Card>

      {/* Professional Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5" />
            Informações Profissionais
          </CardTitle>
          <CardDescription>
            Detalhes sobre sua atuação profissional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ProfileField
              icon={<Building2 className="h-4 w-4" />}
              label="Clínica"
              value={user?.clinicName}
            />
            <ProfileField
              icon={<User className="h-4 w-4" />}
              label="Especialidade"
              value={user?.specialty}
            />
            <ProfileField
              icon={<Award className="h-4 w-4" />}
              label="Registro Profissional"
              value={user?.licenseNumber}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfileTab;
