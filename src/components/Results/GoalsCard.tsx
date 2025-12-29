import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import GoalDetails from "./GoalDetails";
import { useSetCustomerGoals } from "./hooks/useSetCustomerGoals";

const GoalsCard = () => {
  const goals = useSetCustomerGoals();

  return (
    <div>
      {goals && (
        <div className="p-1">
          <Tabs defaultValue="goal0" className="space-y-4">
            <TabsList className="bg-primary-foreground">
              {goals.map((goal, key) => (
                <TabsTrigger value={`goal${key}`} key={key}>
                  Meta {key + 1} - {goal.createdAt}
                </TabsTrigger>
              ))}
            </TabsList>
            {goals.map((goal, key) => (
              <TabsContent value={`goal${key}`} key={key} className="space-y-4">
                {Object.keys(goal.params!).map((param, i) => (
                  <GoalDetails goal={goal} param={param} key={i} />
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default GoalsCard;
