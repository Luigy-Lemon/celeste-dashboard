import { bigNum } from '../lib/math-utils'

export function transformSubscriptionModuleDataAttributes(subscriptionModule) {
  if (!subscriptionModule) {
    return null
  }

  return {
    ...subscriptionModule,
    currentPeriod: parseInt(subscriptionModule.currentPeriod, 10),
    periodDuration: parseInt(subscriptionModule.periodDuration),
    periods: subscriptionModule.periods.map(period => ({
      ...period,
      id: parseInt(period.id, 10),
      totalActiveBalance: period.totalActiveBalance,
      donatedFees: bigNum(period.donatedFees),
    })),
  }
}

export function transformClaimedFeesDataAttributes(claimedFee) {
  return {
    ...claimedFee,
    period: {
      id: parseInt(claimedFee.period.id, 10),
    },
  }
}

export function hasJurorClaimed(claimedFees, periodId) {
  return claimedFees.some(claimedFee => claimedFee.period.id === periodId)
}
