import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/db";

export const RESULT_ID_LENGTH = 5;
// Base58 stays alphanumeric while omitting 0/O and I/l, which are easy to
// confuse when someone has to read or type a result URL manually.
export const RESULT_ID_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const MAX_RESERVATION_ATTEMPTS = 32;
const generateResultId = customAlphabet(RESULT_ID_ALPHABET, RESULT_ID_LENGTH);

type ReserveCandidate = (id: string) => Promise<void>;

export function createResultId(): string {
  return generateResultId();
}

export async function reserveResultIdWith(
  reserveCandidate: ReserveCandidate,
  generateCandidate: () => string = createResultId,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_RESERVATION_ATTEMPTS; attempt += 1) {
    const id = generateCandidate();

    try {
      await reserveCandidate(id);
      return id;
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }
  }

  throw new Error("Could not reserve a unique result ID.");
}

export function reserveResultId(): Promise<string> {
  return reserveResultIdWith(async (id) => {
    await prisma.resultIdReservation.create({ data: { id } });
  });
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
