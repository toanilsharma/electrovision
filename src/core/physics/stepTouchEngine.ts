/**
 * IEEE Std 80-2000 Substation Grounding Step & Touch Voltage Engine
 */

import {
  calculateIEEE80,
  calculateCs,
  getPhysiologicalBodyImpact,
  IEEE80Params,
  IEEE80Result,
  BodyImpactAssessment
} from '@/src/utils/ieee80';

export function createStepTouchEngine(params: IEEE80Params): IEEE80Result {
  return calculateIEEE80(params);
}

export {
  calculateIEEE80,
  calculateCs,
  getPhysiologicalBodyImpact,
  type IEEE80Params,
  type IEEE80Result,
  type BodyImpactAssessment
};
