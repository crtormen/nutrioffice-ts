import { IGoal } from "@/domain/entities";

import GoalInfo from "./GoalInfo";
import { ResultsChart } from "./ResultsChart";

export interface GoalDetailProps {
  goal: IGoal;
  param: string;
}

const GoalDetails = ({ goal, param }: GoalDetailProps) => {
  if (!goal.params || !goal.params[param]) return;

  return (
    <div className="flex gap-2 pt-10">
      <div className="my-auto w-1/2">
        <ResultsChart param={param} goal={goal} />
      </div>
      <div className="my-auto w-1/2">
        <GoalInfo goal={goal} param={param} />
      </div>
    </div>
  );
};

export default GoalDetails;
