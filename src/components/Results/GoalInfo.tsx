import { Progress } from "@/components/ui/progress";

import { GoalDetailProps } from "./GoalDetails";

const setProgressVal = () => {};

const GoalInfo = ({ goal, param }: GoalDetailProps) => {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex justify-evenly gap-6 rounded-md bg-slate-100 p-2">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-primary">Data Inicial</span>
          <span className="font-bold text-slate-600">{goal.createdAt}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-primary">Data Final</span>
          <span className="font-bold text-slate-600">{goal.endDate}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-primary">{param}</span>
          <span className="font-bold text-slate-600">
            {goal.params![param]} {param == "fat" ? "%" : "Kg"}
          </span>
        </div>
      </div>
      <div>
        <Progress value={33} />
      </div>
    </div>
  );
};

export default GoalInfo;
