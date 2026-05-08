import { IVerificationStep } from '@/models/Attendance';

export interface FraudCheckInput {
  studentId: string;
  deviceId?: string;
  browserFingerprint?: string;
  ipAddress?: string;
  gpsLat?: number;
  gpsLng?: number;
  submittedAt: Date;
  recentAttendanceByDevice?: number;   // # records with same device in last 10 min
  recentAttendanceByIP?: number;       // # records with same IP in last 10 min
  recentAttendanceByGPS?: number;      // # records within 5m radius in last 10 min
  timeSinceWindowOpen?: number;        // seconds since attendance window opened
}

export interface FraudCheckResult {
  riskScore: number;          // 0-100
  status: 'clean' | 'suspicious' | 'fraud';
  flags: string[];
  trustScoreDeduction: number;
  verificationStep: IVerificationStep;
}

const CAMPUS_IP_RANGES = ['192.168.', '10.0.', '172.16.'];
const CAMPUS_LAT = 28.7041; // Demo coords (Delhi)
const CAMPUS_LNG = 77.1025;
const GEO_RADIUS_METERS = 100;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isCampusIP(ip: string): boolean {
  return CAMPUS_IP_RANGES.some(range => ip.startsWith(range));
}

export function isWithinCampus(lat: number, lng: number): boolean {
  return haversineDistance(lat, lng, CAMPUS_LAT, CAMPUS_LNG) <= GEO_RADIUS_METERS;
}

export function runFraudCheck(input: FraudCheckInput): FraudCheckResult {
  let riskScore = 0;
  const flags: string[] = [];

  // Same device → multiple users in last 10 min
  if ((input.recentAttendanceByDevice ?? 0) > 0) {
    riskScore += 40;
    flags.push('Device shared across multiple users');
  }

  // IP cluster
  if ((input.recentAttendanceByIP ?? 0) > 5) {
    riskScore += 20;
    flags.push('High IP cluster — possible proxy/sharing');
  }

  // GPS cluster (many students at exact same GPS point)
  if ((input.recentAttendanceByGPS ?? 0) > 8) {
    riskScore += 15;
    flags.push('GPS cluster — possible location spoofing');
  }

  // Too fast (< 5 seconds after window opened)
  if ((input.timeSinceWindowOpen ?? 999) < 5) {
    riskScore += 25;
    flags.push('Suspiciously fast submission');
  }

  // VPN/non-campus IP
  if (input.ipAddress && !isCampusIP(input.ipAddress)) {
    riskScore += 10;
    flags.push('Non-campus IP address detected');
  }

  // Outside campus GPS
  if (input.gpsLat && input.gpsLng && !isWithinCampus(input.gpsLat, input.gpsLng)) {
    riskScore += 30;
    flags.push('Location outside campus boundary');
  }

  const capped = Math.min(riskScore, 100);

  let status: FraudCheckResult['status'] = 'clean';
  if (capped >= 70) status = 'fraud';
  else if (capped >= 30) status = 'suspicious';

  const trustDeduction = status === 'fraud' ? 30 : status === 'suspicious' ? 10 : 0;

  return {
    riskScore: capped,
    status,
    flags,
    trustScoreDeduction: trustDeduction,
    verificationStep: {
      step: 'Fraud Check',
      status: status === 'fraud' ? 'fail' : status === 'suspicious' ? 'fail' : 'pass',
      detail: flags.length > 0 ? flags.join('; ') : 'All clear',
    },
  };
}
