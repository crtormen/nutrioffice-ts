import { useMemo } from "react";
import { differenceInDays, parseISO, parse, isAfter, isBefore } from "date-fns";
import { IGoal } from "@/domain/entities";
import { useFetchCustomerConsultasQuery } from "@/app/state/features/customerConsultasSlice";

interface GoalProgressMetrics {
  currentValue: number | undefined;
  initialValue: number | undefined;
  targetValue: number | undefined;
  progress: number;
  isAchieved: boolean;
  isOnTrack: boolean;
  trend: "up" | "down" | "stable";
}

interface OverallProgress {
  totalProgress: number;
  daysRemaining: number;
  daysElapsed: number;
  totalDays: number;
  status: "achieved" | "active" | "expired" | "behind";
  parameterProgress: Record<string, GoalProgressMetrics>;
}

export const useGoalProgress = (
  goal: IGoal | undefined,
  customerId: string,
  userId: string,
  currentConsultaResults?: any
): OverallProgress | null => {
  const { data: consultas = [] } = useFetchCustomerConsultasQuery({
    uid: userId,
    customerId,
  });

  return useMemo(() => {
    if (!goal || !goal.params || !goal.createdAt || !goal.endDate) {
      return null;
    }

    const startDate = parse(goal.createdAt, "dd/MM/yyyy", new Date());
    const endDate = parse(goal.endDate, "dd/MM/yyyy", new Date());
    const today = new Date();

    // Calculate time metrics
    const totalDays = differenceInDays(endDate, startDate);
    const daysElapsed = differenceInDays(today, startDate);
    const daysRemaining = differenceInDays(endDate, today);

    // Filter consultations from goal start date
    const filteredConsultas = consultas.filter((c) => {
      if (!c.date) return false;
      const consultaDate = parseISO(c.date);
      return (
        isAfter(consultaDate, startDate) ||
        consultaDate.getTime() === startDate.getTime()
      );
    });

    // Get initial consultation (first one at or after goal creation)
    const initialConsulta = filteredConsultas[0];

    // Get current consultation (latest or the one being created)
    const latestConsulta = currentConsultaResults
      ? { results: currentConsultaResults, peso: currentConsultaResults.peso }
      : filteredConsultas[filteredConsultas.length - 1];

    // Calculate progress for each parameter
    const parameterProgress: Record<string, GoalProgressMetrics> = {};
    const progressValues: number[] = [];

    Object.entries(goal.params).forEach(([param, targetValue]) => {
      let initialValue: number | undefined;
      let currentValue: number | undefined;

      // Get initial value
      if (param === "peso") {
        initialValue = initialConsulta?.peso ? Number(initialConsulta.peso) : undefined;
      } else if (initialConsulta?.results) {
        initialValue = initialConsulta.results[param as keyof typeof initialConsulta.results] as number;
      }

      // Get current value
      if (param === "peso") {
        currentValue = latestConsulta?.peso ? Number(latestConsulta.peso) : undefined;
      } else if (latestConsulta?.results) {
        currentValue = latestConsulta.results[param as keyof typeof latestConsulta.results] as number;
      }

      // Calculate progress percentage
      let progress = 0;
      let isAchieved = false;

      if (initialValue !== undefined && currentValue !== undefined && targetValue !== undefined) {
        const delta = targetValue - initialValue;
        const current = currentValue - initialValue;

        if (delta !== 0) {
          progress = (current / delta) * 100;
          // For parameters where decrease is good (fat, mg, peso for weight loss)
          // progress is positive when moving toward target
          isAchieved = progress >= 100;
        }
      }

      // Determine trend (comparing last 2 consultations)
      let trend: "up" | "down" | "stable" = "stable";
      if (filteredConsultas.length >= 2) {
        const prevConsulta = filteredConsultas[filteredConsultas.length - 2];
        let prevValue: number | undefined;

        if (param === "peso") {
          prevValue = Number(prevConsulta.peso);
        } else if (prevConsulta.results) {
          prevValue = prevConsulta.results[param as keyof typeof prevConsulta.results] as number;
        }

        if (prevValue !== undefined && currentValue !== undefined) {
          const diff = currentValue - prevValue;
          if (Math.abs(diff) > 0.1) {
            // Threshold for considering it a change
            trend = diff > 0 ? "up" : "down";
          }
        }
      }

      // Determine if on track (at least 70% of expected progress)
      const expectedProgress = (daysElapsed / totalDays) * 100;
      const isOnTrack = progress >= expectedProgress * 0.7;

      parameterProgress[param] = {
        currentValue,
        initialValue,
        targetValue,
        progress: Math.round(progress),
        isAchieved,
        isOnTrack,
        trend,
      };

      if (!isNaN(progress)) {
        progressValues.push(progress);
      }
    });

    // Calculate overall progress (average of all parameters)
    const totalProgress =
      progressValues.length > 0
        ? Math.round(
            progressValues.reduce((sum, p) => sum + p, 0) / progressValues.length
          )
        : 0;

    // Determine overall status
    let status: "achieved" | "active" | "expired" | "behind";
    if (totalProgress >= 100) {
      status = "achieved";
    } else if (isBefore(endDate, today)) {
      status = "expired";
    } else if (totalProgress < (daysElapsed / totalDays) * 100 * 0.7) {
      status = "behind";
    } else {
      status = "active";
    }

    return {
      totalProgress,
      daysRemaining: Math.max(0, daysRemaining),
      daysElapsed: Math.max(0, daysElapsed),
      totalDays,
      status,
      parameterProgress,
    };
  }, [goal, consultas, customerId, userId, currentConsultaResults]);
};
