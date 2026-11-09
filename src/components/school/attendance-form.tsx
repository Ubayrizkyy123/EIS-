"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  fieldClassName,
  SchoolFormMessage,
} from "@/components/school/form-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  attendanceStatusValues,
} from "@/lib/validations/eis";
import {
  saveDailyAttendanceAction,
  type SchoolActionState,
} from "@/server/actions/school";

const initialState: SchoolActionState = { status: "idle" };

const statusLabels: Record<(typeof attendanceStatusValues)[number], string> = {
  HADIR: "Hadir",
  SAKIT: "Sakit",
  IZIN: "Izin",
  ALPA: "Alpa",
  TERLAMBAT: "Terlambat",
};

type RosterStudent = {
  id: string;
  nis: string;
  fullName: string;
  status: string;
  note: string;
};

export function AttendanceForm({
  classId,
  date,
  students,
}: {
  classId: string;
  date: string;
  students: RosterStudent[];
}) {
  const [state, formAction, pending] = useActionState(
    saveDailyAttendanceAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="date" value={date} />

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NIS</TableHead>
              <TableHead>Nama siswa</TableHead>
              <TableHead className="w-40">Status</TableHead>
              <TableHead className="min-w-52">Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-mono text-xs">{student.nis}</TableCell>
                <TableCell className="font-medium">{student.fullName}</TableCell>
                <TableCell>
                  <input type="hidden" name="studentId" value={student.id} />
                  <select
                    name={`status_${student.id}`}
                    aria-label={`Status ${student.fullName}`}
                    className={fieldClassName}
                    defaultValue={student.status}
                  >
                    {attendanceStatusValues.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  <input
                    name={`note_${student.id}`}
                    aria-label={`Catatan ${student.fullName}`}
                    className={fieldClassName}
                    defaultValue={student.note}
                    maxLength={500}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SchoolFormMessage state={state} />

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan..." : "Simpan absensi"}
      </Button>
    </form>
  );
}
