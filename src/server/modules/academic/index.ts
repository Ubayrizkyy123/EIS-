import { createAcademicYearService } from "./academic-year";
import { createClassService } from "./class";
import { createSubjectService } from "./subject";
import type { AcademicDeps } from "./types";

export type { AcademicDb, AcademicDeps } from "./types";

export function createAcademicServices(deps: AcademicDeps) {
  return {
    academicYearService: createAcademicYearService(deps),
    classService: createClassService(deps),
    subjectService: createSubjectService(deps),
  };
}

export type AcademicServices = ReturnType<typeof createAcademicServices>;
