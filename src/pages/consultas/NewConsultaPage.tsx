/* eslint-disable prettier/prettier */
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { z } from "zod";

import { useConsultaContext } from "@/components/Consultas/context/ConsultaContext";
import { MultiStepEvaluationFormProvider } from "@/components/Consultas/context/MultiStepEvaluationFormContext";
import { NewGoalDialog } from "@/components/Consultas/NewGoalDialog";
import { PersonalData } from "@/components/Consultas/PersonalData";
import { SetEvaluationDrawer } from "@/components/Consultas/SetEvaluationDrawer";
import { SetFeedingHistoryDrawer } from "@/components/Consultas/SetFeedingHistoryDrawer";
import { SetFilesDrawer } from "@/components/Consultas/SetFilesDrawer";
import { SetImagesDrawer } from "@/components/Consultas/SetImagesDrawer";
import { ShowAnamnesis } from "@/components/Consultas/ShowAnamnesis";
import Form, { FormInput, FormTextarea } from "@/components/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
/* eslint-disable spaced-comment */
const sidebarNavItems = [
  {
    title: "Anamnese",
    content: <ShowAnamnesis />,
  },
  {
    title: "Metas",
    content: "",
  },
  {
    title: "Evolução",
    content: "",
  },
  {
    title: "Protocolo",
    content: "",
  },
];

const newConsultaValidationSchema = z.object({
  date: z.date({ required_error: "Data da consulta é obrigatório" }),
  updateCredits: z.boolean().optional(),
  obs: z.string(),
});

type newConsultaFormInputs = z.infer<typeof newConsultaValidationSchema>;

const NewConsultaPage = () => {
  const { handleSetFormData } =
    useConsultaContext();

  function handleSaveConsulta(data: newConsultaFormInputs) {
    console.log(data);
    //update consulta with form data (updateCredits, date, obs) and set pending to false to finish consulta creation
    handleSetFormData(data.updateCredits ? data.updateCredits : false, format(data.date, "dd/MM/yyyy"), data.obs, false)

  }

  return (
    <div className="hidden space-y-6 p-6 pb-16 md:block">
      <PersonalData />
      <div className="flex flex-col space-y-6 lg:flex-row lg:space-x-6 lg:space-y-0">
        <aside className="flex flex-col gap-4 lg:w-1/2">
          <Card>
            <CardHeader>
              <CardTitle>Meta Atual</CardTitle>
              <CardDescription>
                O cliente não possui meta definida. Crie uma no botão abaixo.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <NewGoalDialog />
              {/* <Button variant="outline">
                <Plus /> Criar Meta
              </Button> */}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Cliente</CardTitle>
              <CardDescription>Clique para expandir</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="multiple">
                {sidebarNavItems.map((item, i) => (
                  <AccordionItem value={item.title} key={i}>
                    <AccordionTrigger className="rounded-md bg-secondary px-4">
                      {item.title}
                    </AccordionTrigger>
                    <AccordionContent className="p-2">
                      {item.content}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </aside>
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Nova Consulta</CardTitle>
            </CardHeader>
            <CardContent>
              <Form<newConsultaFormInputs>
                onSubmit={handleSaveConsulta}
                resolver={zodResolver(newConsultaValidationSchema)}
                values={{
                  date: new Date(),
                  updateCredits: true,
                  obs: "",
                }}
                className="flex flex-col gap-6"
              >
                {({
                  register,
                  control,
                  formState: { errors, isSubmitting },
                }) => (
                  <>
                    <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <Label htmlFor="update-credits">Atualizar Créditos</Label>
                      <FormInput
                        type="switch"
                        defaultValue="false"
                        name="updateCredits"
                        control={control}
                        error={errors.updateCredits}
                      />
                    </div>
                    <div className="flex space-x-2 items-center">
                      <Label htmlFor="update-credits">Data da Consulta</Label>
                      <FormInput
                        type="date"
                        placeholder="Ex: 01/02/1990"
                        name="date"
                        register={register}
                        control={control}
                        error={errors.date}
                      />
                    </div>
                    <Separator className="my-4" />

                    <SetFeedingHistoryDrawer />
                    <Separator className="my-4" />
                    <MultiStepEvaluationFormProvider>
                      <SetEvaluationDrawer />
                    </MultiStepEvaluationFormProvider>
                    <Separator className="my-4" />
                    <SetFilesDrawer />
                    <Separator className="my-4" />
                    <SetImagesDrawer />
                    <Separator className="my-4" />
                    <Label htmlFor="obs">Observações</Label>
                    <FormTextarea
                      name="obs"
                      placeholder="Insira aqui informações importantes sobre a consulta"
                      rows={5}
                      register={register}
                      error={errors.obs}
                    />
                    <Separator className="my-4" />
                    <Button type="submit" disabled={isSubmitting}>
                      Salvar Consulta
                    </Button>
                  </>
                )}
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  //load last anamnesis
  //load goals
  //load previous consultas
  //load user data
  //load protocols

  //sidenav
  // Anamnesis
  // Goals
  // Previous Consultas
  // Protocols

  //Header
  //show name, date of creation, contact info, objetivos from anamnesis

  //body
  // Step 1
  //If 1st appointment => Feeding History
  // else Evolution Form

  // Step 2
  //Physical Avaliation

  //Step 3
  //Prescriptions

  //Step 4
  // notes

  // Step 5
  //attachments

  // Step 6
  //Schedule next appointment
};

export default NewConsultaPage;
