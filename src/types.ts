export interface Quota {
  id: number;
  type: string;
  position: string;
  max: number;
}

export interface CustomQuota {
  position: string;
  max: number;
}

export interface Facility {
  id: number;
  name: string;
  type: string;
  state: string;
  district: string;
  township: string;
  customQuotas: CustomQuota[];
  parentFacilityId?: number;
  status?: 'Functioning' | 'Non-Functioning';
  infrastructureStatus?: 'Standard' | 'Sub-standard';
}

export interface Staff {
  id: number;
  name?: string;
  facilityId: number; // Home facility ID (-1 if external)
  currentFacilityId: number; // Dispatched to this facility
  externalFacilityName?: string;
  position: string;
  reason: string; // Attachment reason (not needed for main)
  cv: string; // Will keep this for backward compatibility (maybe filename)
  cvDataUrl?: string; // Base64 data of the file
  dutyStatus: 'Present' | 'Attached';
  activeStatus?: 'Active' | 'Leave' | 'Other';
  activeReason?: string;
}

export interface RegionData {
  name: string;
  districts: {
    name: string;
    townships: string[];
  }[];
}

export interface Position {
  name: string;
  rank: number;
  category: 'Public Health' | 'Clinical';
}

export interface FacilityType {
  name: string;
  category: 'Public Health' | 'Clinical';
}

export interface AppState {
  facilityTypes: FacilityType[];
  positionsList: Position[];
  globalDefaultQuotas: Quota[];
  facilities: Facility[];
  staffEntries: Staff[];
  locations: RegionData[];
}
