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
}

export interface Staff {
  id: number;
  facilityId: number; // Home facility ID (-1 if external)
  currentFacilityId: number; // Dispatched to this facility
  externalFacilityName?: string;
  position: string;
  reason: string; // Attachment reason (not needed for main)
  cv: string;
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

export interface AppState {
  facilityTypes: string[];
  positionsList: string[];
  globalDefaultQuotas: Quota[];
  facilities: Facility[];
  staffEntries: Staff[];
  locations: RegionData[];
}
