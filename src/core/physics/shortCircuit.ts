/**
 * IEC 60909 / IEC 60364-4-43 Short-Circuit Calculation Engine
 */

import {
  calculateIEC60909,
  calculateKappa,
  calculateCableWithstand,
  calculateSmin,
  getKFactor,
  IEC60909Params,
  IEC60909Result
} from '@/src/utils/iec60909';

export function calculateShortCircuit(params: IEC60909Params): IEC60909Result {
  return calculateIEC60909(params);
}

export {
  calculateIEC60909,
  calculateKappa,
  calculateCableWithstand,
  calculateSmin,
  getKFactor,
  type IEC60909Params,
  type IEC60909Result
};
