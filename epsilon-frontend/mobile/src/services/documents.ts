import api from "@/services/api";

export type AdministrativeDocumentType =
  | "attestation_scolarite"
  | "certificat_scolarite"
  | "certificat_radiation";

export interface AdministrativeDocument {
  id: number;
  document_type: AdministrativeDocumentType;
  document_type_label: string;
  school_year: string;
  reference_number: string;
  issued_at: string;
  issued_by_name: string;
  pdf_url: string;
}

export const fetchAdministrativeDocuments = (childId: number) =>
  api
    .get<AdministrativeDocument[]>(`/documents/administrative/?child_id=${childId}`)
    .then((r) => r.data);

export const issueAdministrativeDocument = (
  childId: number,
  documentType: AdministrativeDocumentType,
  schoolYear: string
) =>
  api
    .post<AdministrativeDocument>("/documents/administrative/", {
      child_id: childId,
      document_type: documentType,
      school_year: schoolYear,
    })
    .then((r) => r.data);
