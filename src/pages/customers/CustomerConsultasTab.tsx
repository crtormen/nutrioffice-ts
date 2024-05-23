import { CustomerConsultasTable } from '@/components/Consultas/CustomerConsultasTable'
import { useParams } from 'react-router-dom'

const CustomerConsultasTab = () => {
  const { id } = useParams()
  if (!id) return

  return CustomerConsultasTable(id)
}

export default CustomerConsultasTab
