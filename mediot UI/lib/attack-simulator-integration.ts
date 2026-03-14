/**
 * Attack Simulator Integration Guide
 *
 * The AttackSimulator component can be integrated into any page where you want
 * to allow hackathon judges to simulate attacks and see real-time updates.
 *
 * BASIC USAGE:
 * ============
 *
 * 1. Import the component:
 *    import { AttackSimulator } from '@/components/attack-simulator';
 *
 * 2. Add to your page:
 *    <AttackSimulator
 *      onAttackTriggered={(result) => {
 *        console.log('Attack simulated:', result);
 *        // Trigger refetch of data or state updates
 *      }}
 *      devices={devices}
 *    />
 *
 * INTEGRATION EXAMPLES:
 * =====================
 */

// Example 1: Dashboard Integration
// ---------------------------------
// Add to app/dashboard/page.tsx in the header section:
/*
<div className="flex items-center justify-between">
  <h1>Security Operations Center</h1>
  <AttackSimulator devices={devices} />
</div>
*/

// Example 2: With State Refresh
// ---------------------------
// Use in app/devices/page.tsx to refetch devices after attack:
/*
const [refreshKey, setRefreshKey] = useState(0);

const handleAttackTriggered = (result: AttackSimulationResult) => {
  console.log('Attack triggered on:', result.targetDevice);
  // Force refresh of devices list
  setRefreshKey(prev => prev + 1);
};

<AttackSimulator
  onAttackTriggered={handleAttackTriggered}
  devices={devices}
/>
*/

// Example 3: With Global Context
// --------------------------------
// Use AttackSimulationProvider in root layout:
/*
import { AttackSimulationProvider } from '@/contexts/attack-simulation-context';

export default function RootLayout() {
  return (
    <AttackSimulationProvider>
      {children}
    </AttackSimulationProvider>
  );
}
*/

// Then in any page that needs to react to attacks:
/*
import { useAttackSimulationContext } from '@/contexts/attack-simulation-context';

export default function MyPage() {
  const { lastAttack, simulationCount } = useAttackSimulationContext();

  useEffect(() => {
    if (lastAttack) {
      // Refetch data or update state
      console.log('Attack detected, refreshing data');
    }
  }, [lastAttack]);
}
*/

export interface AttackSimulationResult {
  success: boolean;
  message: string;
  targetDevice?: string;
  timestamp: string;
  simulatedEffects?: {
    trafficIncrease: number;
    dnsIncrease: number;
    trustScoreDecrease: number;
  };
}

/**
 * WHAT HAPPENS WHEN ATTACK IS SIMULATED:
 * =======================================
 *
 * 1. A random device is selected from the device list
 * 2. A random attack type is chosen (DNS Spike, Traffic Flood, etc.)
 * 3. simulateAttack() API is called with the device ID
 * 4. Simulated effects are calculated:
 *    - Traffic increase: +2000 to +10000 bytes
 *    - DNS increase: +50 to +250 queries
 *    - Trust score decrease: -20 to -60 points
 * 5. AttackSimulationResult is returned with all details
 * 6. Callback is triggered for parent component to handle updates
 * 7. Notification is shown with attack details and effects
 *
 * HACKATHON DEMO FLOW:
 * ====================
 * 1. Judge clicks "Simulate Attack" button
 * 2. Random device is targeted
 * 3. Network popup shows attack in progress
 * 4. Dashboard metrics update automatically
 * 5. Device table shows updated device status
 * 6. Alerts center shows new critical alert
 * 7. Analytics charts update to reflect attack
 * 8. Judge can see real-time impact of the attack on the system
 *
 * TRIGGERING AUTOMATIC UPDATES:
 * =============================
 * The attack simulator component provides a callback that parent pages
 * can use to refetch data or trigger UI updates. For example:
 *
 * - Toggle a refresh state variable
 * - Call refetch from React Query or SWR
 * - Trigger useEffect dependencies
 * - Update global state or context
 */

export const ATTACK_TYPES = [
  'DNS Spike Attack',
  'Traffic Flood',
  'Unauthorized Connection',
  'Protocol Violation',
  'Ransomware Signature',
  'Brute Force Attempt',
  'Suspicious Port Scan',
];

export const SIMULATED_EFFECTS = {
  TRAFFIC_MIN: 2000,
  TRAFFIC_MAX: 10000,
  DNS_MIN: 50,
  DNS_MAX: 250,
  TRUST_DECREASE_MIN: 20,
  TRUST_DECREASE_MAX: 60,
};
