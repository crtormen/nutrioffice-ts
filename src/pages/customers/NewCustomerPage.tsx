import { useForm, SubmitHandler, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";

enum GenderEnum {
  'female' = 'Feminino',
  'male' = 'Masculino',
}

const newCustomerValidationSchema = zod.object({
  name: zod.string().min(5, 'Informe o nome do cliente'),
  gender: zod.nativeEnum(GenderEnum, {
    required_error: 'Por favor, selecione um gênero',
  }),
})

type newCustomerFormInputs = zod.infer<typeof newCustomerValidationSchema>

const NewCustomerPage = () => {
  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<newCustomerFormInputs>({
    resolver: zodResolver(newCustomerValidationSchema),
  })
  const onSubmit: SubmitHandler<newCustomerFormInputs> = (data) => {
    console.log(data)
  }

  return (
    <div className="flex-col space-y-8 p-8 md:flex">
      <h2 className="text-3xl font-bold tracking-tight">Novo Cliente</h2>
      {/* <Form {...register, }> */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Label>Nome Completo</Label>
        <Input type="text" placeholder="Nome Completo" {...register('name')} />
        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} value={field.value}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male">Masculino</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female">Feminino</Label>
              </div>
            </RadioGroup>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          Salvar
        </Button>
      </form>
      {/* </Form> */}
    </div>
  )
}

export default NewCustomerPage
