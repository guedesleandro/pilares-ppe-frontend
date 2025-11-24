const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.BACKEND_API_URL ??
  "http://localhost:8000";

const TOKEN_COOKIE_NAME = "ppe_access_token";
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 horas

type ApiSearchParams = Record<
  string,
  string | number | boolean | null | undefined
>;

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
  authenticated?: boolean;
  cache?: RequestCache;
  searchParams?: ApiSearchParams;
};

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function normalizeBaseUrl(): string {
  return API_BASE_URL.replace(/\/$/, "");
}

function buildUrl(path: string, searchParams?: ApiSearchParams): string {
  const base = normalizeBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === null || value === undefined) {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function getBrowserToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
  const tokenCookie = cookies.find((cookie) =>
    cookie.startsWith(`${TOKEN_COOKIE_NAME}=`),
  );

  if (!tokenCookie) {
    return null;
  }

  const [, value] = tokenCookie.split("=");
  return value ? decodeURIComponent(value) : null;
}

async function getServerToken(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE_NAME)?.value ?? null;
}

async function resolveAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return getServerToken();
  }
  return getBrowserToken();
}

export function setAuthTokenCookie(token: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const encodedToken = encodeURIComponent(token);
  const attributes = [
    `Path=/`,
    `Max-Age=${TOKEN_MAX_AGE_SECONDS}`,
    `SameSite=Lax`,
    secure ? "Secure" : null,
  ]
    .filter(Boolean)
    .join("; ");

  document.cookie = `${TOKEN_COOKIE_NAME}=${encodedToken}; ${attributes}`;
}

export function clearAuthTokenCookie(): void {
  if (typeof document === "undefined") {
    return;
  }

  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const attributes = [
    `Path=/`,
    `Max-Age=0`,
    `SameSite=Lax`,
    secure ? "Secure" : null,
  ]
    .filter(Boolean)
    .join("; ");

  document.cookie = `${TOKEN_COOKIE_NAME}=; ${attributes}`;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    headers,
    authenticated = true,
    cache = "no-store",
    searchParams,
  } = options;

  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  let requestBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (
      body instanceof FormData ||
      body instanceof URLSearchParams ||
      typeof body === "string" ||
      body instanceof Blob
    ) {
      requestBody = body;
    } else {
      requestHeaders.set("Content-Type", "application/json");
      requestBody = JSON.stringify(body);
    }
  }

  if (authenticated) {
    const token = await resolveAuthToken();
    if (!token) {
      throw new ApiError("Não autenticado. Faça login novamente.", 401);
    }
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path, searchParams), {
    method,
    headers: requestHeaders,
    body: requestBody,
    cache,
  });

  if (!response.ok) {
    let payload: unknown = null;
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      payload = await response.json().catch(() => null);
    } else {
      payload = await response.text().catch(() => null);
    }

    let detail: string | undefined;
    if (
      payload &&
      typeof payload === "object" &&
      "detail" in payload &&
      typeof (payload as Record<string, unknown>).detail === "string"
    ) {
      detail = (payload as { detail: string }).detail;
    } else if (typeof payload === "string" && payload.trim()) {
      detail = payload;
    } else {
      detail = response.statusText;
    }

    throw new ApiError(
      detail || "Erro ao comunicar com a API.",
      response.status,
      payload,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const responseType = response.headers.get("content-type") ?? "";
  if (responseType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}

// ---------- Tipos compartilhados ----------

export type ActivatorComposition = {
  substance_id: string;
  substance_name?: string;
  volume_ml: number;
};

export type Activator = {
  id: string;
  name: string;
  created_at: string;
  compositions: ActivatorComposition[];
};

export type Substance = {
  id: string;
  name: string;
  created_at: string;
};

export type Medication = {
  id: string;
  name: string;
  created_at: string;
};

export type ActivatorUsageItem = {
  name: string;
  count: number;
};

export type MedicationPreferenceItem = {
  name: string;
  count: number;
};

export type GenderDistributionItem = {
  gender: string;
  count: number;
};

export type TreatmentLocationDistributionItem = {
  location: string;
  count: number;
};

export type WeightLossRankingItem = {
  rank: number;
  patient_id: string;
  patient_name: string;
  weight_loss_kg: number;
  initial_weight_kg: number;
  final_weight_kg: number;
  sessions_count: number;
};

export type WeightLossRankingResponse = {
  items: WeightLossRankingItem[];
  start_date: string | null;
  end_date: string | null;
};

export type WeightGainRankingItem = {
  rank: number;
  patient_id: string;
  patient_name: string;
  weight_gain_kg: number;
  initial_weight_kg: number;
  final_weight_kg: number;
  sessions_count: number;
};

export type WeightGainRankingResponse = {
  items: WeightGainRankingItem[];
  start_date: string | null;
  end_date: string | null;
};

export type MedicationDosageItem = {
  medication_name: string;
  dosage_mg: number;
  patients_count: number;
};

export type MedicationDosageResponse = {
  items: MedicationDosageItem[];
  start_date: string | null;
  end_date: string | null;
};

export type DashboardStatsResponse = {
  total_patients: number;
  sessions_last_30_days: number;
  total_weight_lost_kg: number;
  average_age: number | null;
  activators_usage: ActivatorUsageItem[];
  medications_preference: MedicationPreferenceItem[];
  gender_distribution: GenderDistributionItem[];
  treatment_location_distribution: TreatmentLocationDistributionItem[];
};

export type PatientListItem = {
  id: string;
  name: string;
  process_number: string | null;
  gender: "male" | "female";
  age: number;
  current_cycle_number: number;
  last_session_date: string | null;
  created_at: string;
};

export type PatientsListResponse = {
  items: PatientListItem[];
  page: number;
  page_size: number;
  total: number;
  has_next: boolean;
};

export type MedicationSummary = {
  id: string;
  name: string;
  created_at: string;
};

export type BodyCompositionSummary = {
  registered_at: string;
  weight_kg: string;
  fat_percentage: string;
  fat_kg: string;
  muscle_mass_percentage: string;
  h2o_percentage: string;
  metabolic_age: number;
  visceral_fat: number;
};

export type ActivatorSummary = {
  id: string;
  name: string;
  created_at: string;
  compositions: ActivatorComposition[];
};

export type SessionBodyComposition = {
  id: string;
  patient_id: string;
  session_id: string;
  weight_kg: string;
  fat_percentage: string;
  fat_kg: string;
  muscle_mass_percentage: string;
  h2o_percentage: string;
  metabolic_age: number;
  visceral_fat: number;
  created_at: string;
};

export type SessionDetails = {
  id: string;
  cycle_id: string;
  medication_id: string;
  activator_id: string | null;
  dosage_mg: number | null;
  session_date: string;
  notes: string | null;
  created_at: string;
  medication: MedicationSummary | null;
  activator: ActivatorSummary | null;
  body_composition: SessionBodyComposition | null;
};

export type CycleWithSessions = {
  id: string;
  patient_id: string;
  max_sessions: number;
  periodicity: "weekly" | "biweekly" | "monthly";
  type: "normal" | "maintenance";
  cycle_date: string;
  created_at: string;
  sessions: SessionDetails[];
};

export type PatientSummary = {
  id: string;
  name: string;
  process_number: string | null;
  gender: "male" | "female";
  birth_date: string;
  treatment_location: "clinic" | "home";
  status: "active" | "inactive" | "completed";
  preferred_medication: MedicationSummary | null;
  created_at: string;
  first_session_date: string | null;
  last_session_date: string | null;
  body_composition_initial: BodyCompositionSummary | null;
  body_composition_latest: BodyCompositionSummary | null;
  cycles: CycleWithSessions[];
};

// ---------- Payloads ----------

export type CreateActivatorPayload = {
  name: string;
  compositions: Array<{
    substance_id: string;
    volume_ml: number;
  }>;
};

export type CreateMedicationPayload = {
  name: string;
};

export type CreateSubstancePayload = {
  name: string;
};

export type CreatePatientPayload = {
  name: string;
  gender: "male" | "female";
  birth_date: string;
  process_number: string | null;
  treatment_location: "clinic" | "home";
  preferred_medication_id: string | null;
};

export type UpdatePatientPayload = Partial<CreatePatientPayload>;

export type CreateCyclePayload = {
  cycle_date: string;
  max_sessions: number;
  periodicity: "weekly" | "biweekly" | "monthly";
  type: "normal" | "maintenance";
};

export type CreateSessionPayload = {
  cycle_id: string;
  session_date: string;
  notes: string | null;
  medication_id: string;
  activator_id: string | null;
  dosage_mg: number | null;
  body_composition: {
    weight_kg: number;
    fat_percentage: number;
    fat_kg: number;
    muscle_mass_percentage: number;
    h2o_percentage: number;
    metabolic_age: number;
    visceral_fat: number;
  };
};

// ---------- Auth ----------

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const params = new URLSearchParams();
  params.set("username", username);
  params.set("password", password);

  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    authenticated: false,
  });
}

// ---------- Dashboard ----------

export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  return apiFetch<DashboardStatsResponse>("/dashboard/stats");
}

export async function getWeightLossRanking(
  startDate?: string,
  endDate?: string
): Promise<WeightLossRankingResponse> {
  const searchParams: Record<string, string> = {};
  if (startDate) searchParams.start_date = startDate;
  if (endDate) searchParams.end_date = endDate;
  
  return apiFetch<WeightLossRankingResponse>(
    "/dashboard/weight-loss-ranking",
    { searchParams }
  );
}

export async function getWeightGainRanking(
  startDate?: string,
  endDate?: string
): Promise<WeightGainRankingResponse> {
  const searchParams: Record<string, string> = {};
  if (startDate) searchParams.start_date = startDate;
  if (endDate) searchParams.end_date = endDate;
  
  return apiFetch<WeightGainRankingResponse>(
    "/dashboard/weight-gain-ranking",
    { searchParams }
  );
}

export async function getMedicationDosage(
  startDate?: string,
  endDate?: string
): Promise<MedicationDosageResponse> {
  const searchParams: Record<string, string> = {};
  if (startDate) searchParams.start_date = startDate;
  if (endDate) searchParams.end_date = endDate;
  
  return apiFetch<MedicationDosageResponse>(
    "/dashboard/medication-dosage",
    { searchParams }
  );
}

// ---------- Activators ----------

export async function listActivators(): Promise<Activator[]> {
  return apiFetch<Activator[]>("/activators");
}

export async function createActivator(
  payload: CreateActivatorPayload,
): Promise<Activator> {
  return apiFetch<Activator>("/activators", {
    method: "POST",
    body: payload,
  });
}

export async function updateActivator(
  activatorId: string,
  payload: CreateActivatorPayload,
): Promise<Activator> {
  return apiFetch<Activator>(`/activators/${activatorId}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteActivator(activatorId: string): Promise<void> {
  await apiFetch(`/activators/${activatorId}`, {
    method: "DELETE",
  });
}

// ---------- Substances ----------

export async function listSubstances(): Promise<Substance[]> {
  return apiFetch<Substance[]>("/substances");
}

export async function createSubstance(
  payload: CreateSubstancePayload,
): Promise<Substance> {
  return apiFetch<Substance>("/substances", {
    method: "POST",
    body: payload,
  });
}

export async function updateSubstance(
  substanceId: string,
  payload: CreateSubstancePayload,
): Promise<Substance> {
  return apiFetch<Substance>(`/substances/${substanceId}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteSubstance(substanceId: string): Promise<void> {
  await apiFetch(`/substances/${substanceId}`, {
    method: "DELETE",
  });
}

// ---------- Medications ----------

export async function listMedications(): Promise<Medication[]> {
  return apiFetch<Medication[]>("/medications");
}

export async function createMedication(
  payload: CreateMedicationPayload,
): Promise<Medication> {
  return apiFetch<Medication>("/medications", {
    method: "POST",
    body: payload,
  });
}

export async function updateMedication(
  medicationId: string,
  payload: CreateMedicationPayload,
): Promise<Medication> {
  return apiFetch<Medication>(`/medications/${medicationId}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteMedication(medicationId: string): Promise<void> {
  await apiFetch(`/medications/${medicationId}`, {
    method: "DELETE",
  });
}

// ---------- Patients ----------

export type GetPatientsParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function listPatients(
  params: GetPatientsParams = {},
): Promise<PatientsListResponse> {
  const searchParams: ApiSearchParams = {
    search: params.search,
    page: params.page,
    page_size: params.pageSize,
  };

  return apiFetch<PatientsListResponse>("/patients/listing", {
    searchParams,
  });
}

export async function createPatient(
  payload: CreatePatientPayload,
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/patients", {
    method: "POST",
    body: payload,
  });
}

export async function updatePatient(
  patientId: string,
  payload: UpdatePatientPayload,
): Promise<void> {
  await apiFetch(`/patients/${patientId}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deletePatient(patientId: string): Promise<void> {
  await apiFetch(`/patients/${patientId}`, {
    method: "DELETE",
  });
}

export async function getPatientSummary(
  patientId: string,
): Promise<PatientSummary> {
  const [summary, cycles] = await Promise.all([
    apiFetch<Omit<PatientSummary, "cycles">>(`/patients/${patientId}/summary`),
    apiFetch<CycleWithSessions[]>(`/patients/${patientId}/cycles`),
  ]);

  return {
    ...summary,
    cycles,
  };
}

export async function createCycleForPatient(
  patientId: string,
  payload: CreateCyclePayload,
): Promise<void> {
  await apiFetch(`/patients/${patientId}/cycles`, {
    method: "POST",
    body: payload,
  });
}

export async function deleteCycle(cycleId: string): Promise<void> {
  await apiFetch(`/cycles/${cycleId}`, {
    method: "DELETE",
  });
}

export async function createSession(
  cycleId: string,
  payload: CreateSessionPayload,
): Promise<void> {
  await apiFetch(`/cycles/${cycleId}/sessions`, {
    method: "POST",
    body: payload,
  });
}

export async function deleteSession(sessionId: string): Promise<void> {
  await apiFetch(`/sessions/${sessionId}`, {
    method: "DELETE",
  });
}

