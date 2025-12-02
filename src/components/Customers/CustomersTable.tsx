import { Loader2 } from "lucide-react";

import { DataTable } from "@/components/ui/data-table";

import { columns } from "./columns";
import { customerFuzzyFilter } from "./customerFilter";
import { CustomerSearchInput } from "./CustomerSearchInput";
import { useFillCustomerTable } from "./hooks";

const CustomersTable = () => {
  const {
    customers,
    result: { isLoading },
  } = useFillCustomerTable();

  return isLoading ? (
    <Loader2 className="mx-auto size-8 animate-spin items-center text-zinc-500" />
  ) : (
    customers && (
      <DataTable
        columns={columns}
        data={customers}
        customSearchComponent={
          <CustomerSearchInput value="" onChange={() => {}} />
        }
        globalFilterFn={customerFuzzyFilter}
      />
    )
  );
};
export default CustomersTable;
