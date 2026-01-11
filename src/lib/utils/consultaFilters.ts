import { ICustomerConsulta } from "@/domain/entities";

export type ConsultaType = "hybrid" | "online" | "in-person";

export interface ConsultaClassification {
  online: ICustomerConsulta[];
  inPerson: ICustomerConsulta[];
  all: ICustomerConsulta[];
  hasOnline: boolean;
  hasInPerson: boolean;
  isHybrid: boolean;
  type: ConsultaType;
}

/**
 * Classifies consultas into online, in-person, or hybrid categories
 * @param consultas - Array of customer consultas to classify
 * @returns Classification object with filtered arrays and metadata
 */
export const classifyConsultas = (
  consultas: ICustomerConsulta[] = [],
): ConsultaClassification => {
  // Filter consultas by type
  // Online consultas have online === true
  // In-person consultas have online === false or undefined
  const online = consultas.filter((c) => c.online === true);
  const inPerson = consultas.filter((c) => !c.online);

  const hasOnline = online.length > 0;
  const hasInPerson = inPerson.length > 0;
  const isHybrid = hasOnline && hasInPerson;

  // Determine overall type
  let type: ConsultaType;
  if (isHybrid) {
    type = "hybrid";
  } else if (hasOnline) {
    type = "online";
  } else {
    type = "in-person";
  }

  return {
    online,
    inPerson,
    all: consultas,
    hasOnline,
    hasInPerson,
    isHybrid,
    type,
  };
};

/**
 * Checks if a consulta has complete body composition data
 * Online consultas typically lack this data
 */
export const hasBodyCompositionData = (
  consulta: ICustomerConsulta,
): boolean => {
  return !!(
    consulta.results &&
    Object.keys(consulta.results).length > 0 &&
    consulta.dobras &&
    Object.keys(consulta.dobras).length > 0
  );
};

/**
 * Checks if a consulta has circumference measurements
 */
export const hasCircumferenceData = (consulta: ICustomerConsulta): boolean => {
  return !!(consulta.medidas && Object.keys(consulta.medidas).length > 0);
};

/**
 * Checks if a consulta has photos
 */
export const hasPhotoData = (consulta: ICustomerConsulta): boolean => {
  if (!consulta.images) return false;

  const hasAnyPhoto =
    (consulta.images.img_frente &&
      Object.keys(consulta.images.img_frente).length > 0) ||
    (consulta.images.img_costas &&
      Object.keys(consulta.images.img_costas).length > 0) ||
    (consulta.images.img_lado && Object.keys(consulta.images.img_lado).length > 0);

  return !!hasAnyPhoto;
};
