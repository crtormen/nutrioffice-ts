import React from "react";

// import { Button } from "@/components/ui/button";

const Dashboard = () => {
  return (
    <div className="space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Visão Geral</h2>
          <p className="text-muted-foreground">
            Acompanhe aqui algumas informações importantes!
          </p>
        </div>
        {/* <div className="flex items-center space-x-2">
                <CalendarDateRangePicker />
                <Button>Download</Button>
              </div> */}
      </div>
    </div>
  );
};

export default Dashboard;
