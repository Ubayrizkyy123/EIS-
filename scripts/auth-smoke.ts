import "dotenv/config";
import { spawn } from "node:child_process";
import path from "node:path";

const port = 3199;
const baseUrl = `http://localhost:${port}`;
const password = process.env.SEED_PASSWORD ?? "Password123!";

type CookieJar = Map<string, string>;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function getSetCookies(response: Response) {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (headers.getSetCookie) {
    return headers.getSetCookie();
  }

  const cookie = response.headers.get("set-cookie");
  return cookie ? [cookie] : [];
}

function captureCookies(response: Response, jar: CookieJar) {
  for (const cookie of getSetCookies(response)) {
    const pair = cookie.split(";")[0];
    const separator = pair.indexOf("=");

    if (separator > 0) {
      jar.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
  }
}

function cookieHeader(jar: CookieJar) {
  return [...jar.entries()]
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function hasSessionCookie(jar: CookieJar) {
  return [...jar.keys()].some((name) => name.includes("session-token"));
}

async function login(email: string): Promise<CookieJar | null> {
  const jar: CookieJar = new Map();

  const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`, {
    redirect: "manual",
  });
  captureCookies(csrfResponse, jar);

  const csrfBody = (await csrfResponse.json()) as { csrfToken?: string };
  assert(csrfBody.csrfToken, "CSRF token tidak tersedia.");

  const body = new URLSearchParams({
    csrfToken: csrfBody.csrfToken,
    email,
    password,
    callbackUrl: `${baseUrl}/dashboard`,
  });

  const response = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHeader(jar),
    },
    body,
  });
  captureCookies(response, jar);

  return hasSessionCookie(jar) ? jar : null;
}

async function get(pathname: string, jar?: CookieJar) {
  return fetch(`${baseUrl}${pathname}`, {
    redirect: "manual",
    headers: jar ? { cookie: cookieHeader(jar) } : undefined,
  });
}

const redirectStatuses = [302, 303, 307, 308];

function getRedirectTarget(response: Response, body: string) {
  if (redirectStatuses.includes(response.status)) {
    return response.headers.get("location");
  }

  const flightRedirect = body.match(
    /NEXT_REDIRECT;[^;]+;([^;]+);\d+;/,
  );

  if (flightRedirect) {
    return flightRedirect[1].replace(/\\\//g, "/");
  }

  const metaTag = body.match(
    /<meta[^>]+id=["']__next-page-redirect["'][^>]*>/i,
  );

  if (!metaTag) {
    return null;
  }

  const content = metaTag[0].match(/content=["'][^"']*url=([^"';]+)/i);
  return content?.[1] ?? null;
}

function isRedirectTo(response: Response, body: string, pathname: string) {
  const target = getRedirectTarget(response, body);

  if (!target) {
    return false;
  }

  try {
    return new URL(target, baseUrl).pathname === pathname;
  } catch {
    return target.split("?")[0] === pathname;
  }
}

async function assertStatus(
  label: string,
  response: Response,
  expectedStatus: number,
) {
  const body = await response.text();

  assert(
    response.status === expectedStatus,
    `${label}: status ${response.status}, body=${body.slice(0, 200)}`,
  );
}

async function post(pathname: string, jar: CookieJar, body: string) {
  return fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/json",
      cookie: cookieHeader(jar),
    },
    body,
  });
}

async function getJson<T>(pathname: string, jar: CookieJar) {
  const response = await get(pathname, jar);
  const body = await response.text();

  assert(
    response.status === 200,
    `GET ${pathname}: status ${response.status}, body=${body.slice(0, 200)}`,
  );

  return JSON.parse(body) as T;
}

async function waitForServer(child: ReturnType<typeof spawn>) {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Server berhenti dengan kode ${child.exitCode}.`);
    }

    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error("Server tidak siap dalam 60 detik.");
}

async function main() {
  const child = spawn(
    process.execPath,
    [path.join("node_modules", "next", "dist", "bin", "next"), "start", "-p", String(port)],
    {
      env: { ...process.env, AUTH_URL: baseUrl },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );

  let output = "";
  child.stdout?.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.stderr?.on("data", (chunk) => {
    output += chunk.toString();
  });

  try {
    await waitForServer(child);

    const unauthResponse = await get("/executive");
    const unauthBody = await unauthResponse.text();
    assert(
      isRedirectTo(unauthResponse, unauthBody, "/login"),
      `Halaman protected seharusnya redirect ke /login. Status ${unauthResponse.status}, target ${getRedirectTarget(unauthResponse, unauthBody) ?? "-"}.`,
    );

    const loginTarget = getRedirectTarget(unauthResponse, unauthBody);
    assert(loginTarget, "Target redirect login tidak ditemukan.");

    const loginUrl = new URL(loginTarget, baseUrl);
    assert(
      loginUrl.searchParams.get("reason") === "session",
      "Redirect login seharusnya menyertakan reason=session.",
    );

    await assertStatus(
      "API protected tanpa login",
      await get("/api/eis/users"),
      401,
    );

    const invalidLogin = await login("guru@example.com");
    assert(!invalidLogin, "Akun legacy nonaktif tidak boleh login.");

    const roleCases = [
      {
        email: "kepala@example.com",
        home: "/executive",
        allowed: "/executive",
        denied: "/admin",
        deniedSentinel: "Komposisi role aktif",
      },
      {
        email: "demo@example.com",
        home: "/admin",
        allowed: "/users",
        denied: "/executive",
        deniedSentinel: "Ringkasan KPI, keuangan",
      },
      {
        email: "operator@example.com",
        home: "/operator",
        allowed: "/operator",
        denied: "/users",
        deniedSentinel: "Kelola akun yang dapat masuk",
      },
    ];
    const roleJars = new Map<string, CookieJar>();

    for (const roleCase of roleCases) {
      const jar = await login(roleCase.email);
      assert(jar, `Login ${roleCase.email} gagal.`);
      roleJars.set(roleCase.email, jar);

      await assertStatus(
        `${roleCase.home} untuk ${roleCase.email}`,
        await get(roleCase.home, jar),
        200,
      );
      await assertStatus(
        `${roleCase.allowed} untuk ${roleCase.email}`,
        await get(roleCase.allowed, jar),
        200,
      );

      const denied = await get(roleCase.denied, jar);
      const deniedBody = await denied.text();
      const deniedTarget = getRedirectTarget(denied, deniedBody);

      assert(
        isRedirectTo(denied, deniedBody, "/forbidden"),
        `${roleCase.denied} seharusnya redirect /forbidden untuk ${roleCase.email}. Status ${denied.status}, target ${deniedTarget ?? "-"}.`,
      );
      assert(
        !deniedBody.includes(roleCase.deniedSentinel),
        `${roleCase.denied} membocorkan konten halaman terlarang untuk ${roleCase.email}.`,
      );
    }

    const kepalaJar = roleJars.get("kepala@example.com");
    const adminJar = roleJars.get("demo@example.com");
    const operatorJar = roleJars.get("operator@example.com");

    assert(kepalaJar, "Cookie jar kepala sekolah tidak ditemukan.");
    assert(adminJar, "Cookie jar admin tidak ditemukan.");
    assert(operatorJar, "Cookie jar operator tidak ditemukan.");

    await assertStatus(
      "Kepala GET users",
      await get("/api/eis/users", kepalaJar),
      403,
    );
    await assertStatus(
      "Operator GET users",
      await get("/api/eis/users", operatorJar),
      403,
    );
    await assertStatus(
      "Admin GET users",
      await get("/api/eis/users", adminJar),
      200,
    );
    await assertStatus(
      "Kepala GET KPI",
      await get("/api/eis/kpi-indicators", kepalaJar),
      200,
    );
    await assertStatus(
      "Operator GET KPI",
      await get("/api/eis/kpi-indicators", operatorJar),
      403,
    );

    for (const [label, jar] of [
      ["Kepala", kepalaJar],
      ["Admin", adminJar],
      ["Operator", operatorJar],
    ] as const) {
      await assertStatus(
        `${label} GET academic-years`,
        await get("/api/eis/academic-years", jar),
        200,
      );

      for (const pathname of [
        "/academic-years",
        "/classes",
        "/teachers",
        "/students",
        "/attendance",
        "/finance",
        "/facilities",
        "/maintenance",
      ]) {
        await assertStatus(
          `${label} GET ${pathname}`,
          await get(pathname, jar),
          200,
        );
      }
    }

    const academicYearPayload = JSON.stringify({
      name: "2026/2027",
      startDate: "2026-07-13",
      endDate: "2027-06-30",
      isActive: false,
    });

    await assertStatus(
      "Kepala POST academic-years (read-only 403)",
      await post("/api/eis/academic-years", kepalaJar, academicYearPayload),
      403,
    );
    await assertStatus(
      "Admin POST academic-years duplikat (authorized 409)",
      await post("/api/eis/academic-years", adminJar, academicYearPayload),
      409,
    );
    await assertStatus(
      "Operator POST academic-years duplikat (authorized 409)",
      await post("/api/eis/academic-years", operatorJar, academicYearPayload),
      409,
    );

    const years = await getJson<{
      data: Array<{
        id: string;
        isActive: boolean;
        startDate: string;
        endDate: string;
      }>;
    }>("/api/eis/academic-years?limit=100", operatorJar);
    const activeYear = years.data.find((year) => year.isActive) ?? years.data[0];

    assert(activeYear, "Tahun ajaran seed tidak ditemukan.");

    const classes = await getJson<{
      data: Array<{ id: string; academicYearId: string }>;
    }>("/api/eis/classes?limit=100", operatorJar);
    const schoolClass = classes.data.find(
      (item) => item.academicYearId === activeYear.id,
    );

    assert(schoolClass, "Kelas pada tahun ajaran aktif tidak ditemukan.");

    await assertStatus(
      "Kepala GET executive dengan filter akademik",
      await get(
        `/executive?academicYearId=${activeYear.id}&classId=${schoolClass.id}`,
        kepalaJar,
      ),
      200,
    );
    await assertStatus(
      "Kepala GET executive dengan filter tidak valid",
      await get(
        "/executive?academicYearId=tidak-ada&classId=tidak-ada",
        kepalaJar,
      ),
      200,
    );

    const enrollments = await getJson<{
      data: Array<{ studentId: string; status: string }>;
    }>(`/api/eis/enrollments?classId=${schoolClass.id}&limit=100`, operatorJar);
    const activeStudents = enrollments.data
      .filter((enrollment) => enrollment.status === "AKTIF")
      .slice(0, 2);

    assert(
      activeStudents.length > 0,
      "Enrollment aktif untuk uji absensi bulk tidak ditemukan.",
    );

    const attendanceDate = new Date(activeYear.startDate);
    attendanceDate.setUTCDate(attendanceDate.getUTCDate() + 1);
    const bulkAttendancePayload = JSON.stringify({
      classId: schoolClass.id,
      date: attendanceDate.toISOString().slice(0, 10),
      entries: activeStudents.map((enrollment) => ({
        studentId: enrollment.studentId,
        status: "HADIR",
        note: null,
      })),
    });

    await assertStatus(
      "Kepala POST attendance bulk (read-only 403)",
      await post(
        "/api/eis/attendance/bulk",
        kepalaJar,
        bulkAttendancePayload,
      ),
      403,
    );
    await assertStatus(
      "Admin POST attendance bulk (authorized 200)",
      await post(
        "/api/eis/attendance/bulk",
        adminJar,
        bulkAttendancePayload,
      ),
      200,
    );
    await assertStatus(
      "Operator POST attendance bulk (authorized 200)",
      await post(
        "/api/eis/attendance/bulk",
        operatorJar,
        bulkAttendancePayload,
      ),
      200,
    );

    console.log("Auth smoke test lulus.");
  } catch (error) {
    console.error(output.slice(-4000));
    throw error;
  } finally {
    child.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
