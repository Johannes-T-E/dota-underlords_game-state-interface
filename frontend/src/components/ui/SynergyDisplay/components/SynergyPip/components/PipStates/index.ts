// 1 pip per bar states
export { PipState_A, PipState_E, PipState_B } from './PipStates_1';

// 2 pips per bar states
export { PipState_AA, PipState_EE, PipState_BB, PipState_AE, PipState_AB, PipState_BE } from './PipStates_2';

// 3 pips per bar states
export { 
  PipState_AAA, 
  PipState_EEE, 
  PipState_BBB, 
  PipState_ABE, 
  PipState_AEE, 
  PipState_AAE, 
  PipState_ABB, 
  PipState_AAB, 
  PipState_BEE, 
  PipState_BBE 
} from './PipStates_3';

// Component map for dynamic lookup
import { PipState_A, PipState_E, PipState_B } from './PipStates_1';
import { PipState_AA, PipState_EE, PipState_BB, PipState_AE, PipState_AB, PipState_BE } from './PipStates_2';
import { 
  PipState_AAA, PipState_EEE, PipState_BBB, PipState_ABE, PipState_AEE, 
  PipState_AAE, PipState_ABB, PipState_AAB, PipState_BEE, PipState_BBE 
} from './PipStates_3';

export type PipStateComponent = React.FC;

export const STATE_COMPONENTS: Record<string, Record<string, PipStateComponent>> = {
  '1_pip_per_bar': {
    A: PipState_A,
    E: PipState_E,
    B: PipState_B
  },
  '2_pips_per_bar': {
    AA: PipState_AA,
    EE: PipState_EE,
    BB: PipState_BB,
    AE: PipState_AE,
    AB: PipState_AB,
    BE: PipState_BE
  },
  '3_pips_per_bar': {
    AAA: PipState_AAA,
    EEE: PipState_EEE,
    BBB: PipState_BBB,
    ABE: PipState_ABE,
    AEE: PipState_AEE,
    AAE: PipState_AAE,
    ABB: PipState_ABB,
    AAB: PipState_AAB,
    BEE: PipState_BEE,
    BBE: PipState_BBE
  }
};

