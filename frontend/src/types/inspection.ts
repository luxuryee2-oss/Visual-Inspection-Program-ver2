export interface InspectionData {
  productName: string;
  inspector: string;
  notes: string;
  photos: {
    front: string | null;
    back: string | null;
    left: string | null;
    right: string | null;
  };
}



