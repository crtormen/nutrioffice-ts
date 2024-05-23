import { IGoal } from "@/domain/entities";
import { ResultsChart } from "./ResultsChart";
import GoalInfo from "./GoalInfo";

export interface GoalDetailProps {
  goal: IGoal;
  param: string;
}

const GoalDetails = ({ goal, param }: GoalDetailProps) => {
  if (!goal.params || !goal.params[param]) return;

  return (
    <div className="flex gap-2 pt-10">
      <div className="w-1/2 my-auto">
        <ResultsChart param={param} goal={goal} />
      </div>
      <div className="w-1/2 my-auto">
        <GoalInfo goal={goal} param={param} />
      </div>
    </div>
  );
};

export default GoalDetails;
