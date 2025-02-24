import React, { useCallback, useMemo } from 'react'
import {
  Box,
  Button,
  GU,
  Help,
  Info,
  Link,
  textStyle,
  Timer,
  useTheme,
} from '@1hive/1hive-ui'

import Loading from '../Loading'
import NoRewards from './NoRewards'

import { useWallet } from '../../providers/Wallet'
import { useCourtConfig } from '../../providers/CourtConfig'
import useJurorSubscriptionFees from '../../hooks/useJurorSubscriptionFees'

import { addressesEqual } from '../../lib/web3-utils'
import { bigNum, formatTokenAmount } from '../../lib/math-utils'
import { getTermEndTime } from '../../utils/court-utils'

// anjRewards => HNY => First settle with `onSettleReward()`, then withdraw
// feeRewards => HNY =>  First settle with `onSettleReward()` or `onSettleAppealDeposit()`, then withdraw
// subscriptions fees => HNY => Can be withdrawn directly from the CourtSubscription contract
// Only after the rewards are settled can a juror withdraw them from the treasury (`onWithdraw()`)
// As opposed to fee rewards, subscription fees are directly withdrawn to the juror's wallet when claimed
const RewardsModule = React.memo(function RewardsModule({
  rewards,
  treasury,
  loading,
  onClaimRewards,
}) {
  const wallet = useWallet()
  const { feeToken } = useCourtConfig()

  // Subscriptions are fetched directly from the subscriptions contract
  const subscriptionFees = useJurorSubscriptionFees()
  const { anjRewards, feeRewards } = rewards || {}

  const {
    totalAppealFees,
    totalArbitrableFees,
    totalSettledFees,
    totalSubscriptionFees,
  } = useTotalFeeRewards(
    feeRewards?.arbitrableFees,
    feeRewards?.appealFees,
    subscriptionFees
  )

  // We'll get the total juror's balance held in the treasury
  // TODO: feeToken can change over time, this means jurors could have multiple balances in the treasury (one for each fee token).
  //       - Handle potential multiple fee token balances
  const treasuryToken = treasury?.find(({ token }) =>
    addressesEqual(token.id, feeToken.id)
  )
  const treasuryBalance = treasuryToken ? treasuryToken.amount : bigNum(0)

  // Total dispute fees include appeal fees and arbitrable fees (fees paid by the creator of the dispute for the first round
  // and fees paid by appealers for subsequent rounds)
  const totalDisputesFees = totalArbitrableFees.add(totalAppealFees)

  // All dispute fees are sent to the treasury after being settled
  // Note that the total dispute fees could include already settled fees so we must discount them from the total treasury fees
  const totalTreasuryFees = totalDisputesFees
    .sub(totalSettledFees)
    .add(treasuryBalance)
  const totalFeeRewards = totalTreasuryFees.add(totalSubscriptionFees)

  // Form submission
  const handleFormSubmit = useCallback(
    event => {
      event.preventDefault()

      if (!rewards) return

      onClaimRewards(
        wallet.account,
        feeRewards.arbitrableFees,
        feeRewards.appealFees,
        totalTreasuryFees,
        subscriptionFees,
        feeToken.id
      )
    },
    [
      feeRewards,
      feeToken,
      onClaimRewards,
      rewards,
      subscriptionFees,
      totalTreasuryFees,
      wallet.account,
    ]
  )

  const hasRewardsToClaim = anjRewards?.gt(0) || totalFeeRewards.gt(0)
  const showHeading = !loading && hasRewardsToClaim

  return (
    <Box
      heading={showHeading && 'Rewards'}
      padding={hasRewardsToClaim ? 0 : 3 * GU}
    >
      {(() => {
        if (loading) {
          return <Loading height={150} size="large" />
        }

        if (!hasRewardsToClaim) {
          return <NoRewards />
        }

        return (
          <div>
            {rewards && anjRewards.gt(0) && <HNYRewards amount={anjRewards} />}
            {totalFeeRewards.gt(0) && (
              <FeeSection>
                <form onSubmit={handleFormSubmit}>
                  {totalDisputesFees.gt(0) && (
                    <DisputesFeeRewards
                      totalAppealFees={totalAppealFees}
                      totalArbitrableFees={totalArbitrableFees}
                      distribution={feeRewards.distribution}
                    />
                  )}
                  {totalSubscriptionFees.gt(0) && (
                    <SubscriptionFeeRewards totalFees={totalSubscriptionFees} />
                  )}
                  <TotalFees
                    totalFees={totalFeeRewards}
                    withBorder={totalSubscriptionFees
                      .add(totalDisputesFees)
                      .gt(0)}
                  />
                </form>
              </FeeSection>
            )}
          </div>
        )
      })()}
    </Box>
  )
})

const HNYRewards = ({ amount }) => {
  const { anjToken } = useCourtConfig()

  const formattedAmount = formatTokenAmount(
    amount,
    true,
    anjToken.decimals,
    true
  )

  return (
    <FeeSection>
      <RowFee
        label="Ruling rewards"
        amount={formattedAmount}
        symbol={anjToken.symbol}
        help="These rewards are from keepers who failed to vote with the plurality ruling."
        showPositive
        css={`
          margin-bottom: ${2 * GU}px;
        `}
      />
      <Info>This amount will be sent to your inactive wallet.</Info>
    </FeeSection>
  )
}

const DisputesFeeRewards = ({
  distribution,
  totalAppealFees,
  totalArbitrableFees,
}) => {
  const theme = useTheme()
  const { feeToken } = useCourtConfig()
  const { symbol, decimals } = feeToken

  // Format total amounts
  const totalArbitrableFormatted = formatTokenAmount(
    totalArbitrableFees,
    true,
    decimals,
    true
  )
  const totalAppealFormatted = formatTokenAmount(
    totalAppealFees,
    true,
    decimals,
    true
  )

  return (
    <>
      {totalArbitrableFees.gt(0) && (
        <RowFee
          label="Dispute rewards"
          amount={totalArbitrableFormatted}
          symbol={symbol}
          showPositive
          css={`
            margin-bottom: ${2 * GU}px;
          `}
        />
      )}
      {totalAppealFees.gt(0) && (
        <RowFee
          label="Appeal rewards"
          amount={totalAppealFormatted}
          symbol={symbol}
          showPositive
          css={`
            margin-bottom: ${2 * GU}px;
          `}
        />
      )}
      <div
        css={`
          display: flex;
          align-items: center;
          margin-bottom: ${2 * GU}px;
        `}
      >
        <span
          css={`
            color: ${theme.help};
            margin-right: ${1 * GU}px;
          `}
        >
          Distribution
        </span>
        <Help hint="Rewards per dispute">
          <DisputesFeeDistribution
            symbol={symbol}
            decimals={decimals}
            distribution={distribution}
          />
        </Help>
      </div>
    </>
  )
}

function SubscriptionFeeRewards({ totalFees }) {
  const theme = useTheme()
  const { feeToken, subscriptionModule, terms, termDuration } = useCourtConfig()
  const formattedAmount = formatTokenAmount(
    totalFees,
    true,
    feeToken.decimals,
    true
  )

  const { currentPeriod, periodDuration } = subscriptionModule
  const periodEndTerm = currentPeriod * periodDuration + periodDuration

  return (
    <>
      <RowFee
        label="Staking rewards"
        amount={formattedAmount}
        symbol={feeToken.symbol}
        showPositive
        css={`
          margin-bottom: ${2 * GU}px;
        `}
      />
      <Info
        mode="warning"
        css={`
          display: flex;
          align-items: flex-start;
          margin-bottom: ${2 * GU}px;
        `}
      >
        <div
          css={`
            & > time {
              ${textStyle('body3')};
              display: inline-block;

              & span {
                color: ${theme.warningSurfaceContent};
                font-weight: bold;
              }
            }
          `}
        >
          You must claim your staking rewards within{' '}
          <Timer
            end={getTermEndTime(periodEndTerm, { terms, termDuration })}
            showIcon={false}
          />{' '}
          or you will forfeit them.
        </div>
      </Info>
    </>
  )
}

function TotalFees({ totalFees, withBorder }) {
  const theme = useTheme()
  const { feeToken } = useCourtConfig()

  const { symbol, decimals } = feeToken
  const totalFeesFormatted = formatTokenAmount(totalFees, true, decimals, true)

  return (
    <div
      css={`
        ${withBorder && `border-top: 1px solid ${theme.border};`}
        margin-top: ${2 * GU}px;
        padding-top: ${2 * GU}px;
      `}
    >
      <RowFee
        label="Total rewards"
        amount={totalFeesFormatted}
        symbol={symbol}
        showPositive
      />
      <Button
        mode="positive"
        type="submit"
        wide
        css={`
          margin-top: ${2 * GU}px;
        `}
      >
        Claim rewards
      </Button>
    </div>
  )
}

const DisputesFeeDistribution = ({ distribution, symbol, decimals }) => {
  const theme = useTheme()
  return (
    <div>
      <h3
        css={`
          ${textStyle('label2')};
          color: ${theme.surfaceContentSecondary};
          margin-bottom: ${2 * GU}px;
        `}
      >
        Rewards distribution per dispute
      </h3>
      {distribution
        .sort((d1, d2) => d1.disputeId - d2.disputeId)
        .map(({ disputeId, amount }) => {
          const formattedAmount = formatTokenAmount(amount, false, decimals)

          return (
            <RowFee
              key={disputeId}
              css={`
                ${textStyle('body2')};
                margin-bottom: ${1 * GU}px;
              `}
              label={
                <Link href={`#/disputes/${disputeId}`} external={false}>
                  {`Dispute #${disputeId}`}
                </Link>
              }
              isLabelLink
              amount={formattedAmount}
              symbol={symbol}
              showPositive={false}
            />
          )
        })}
    </div>
  )
}

const RowFee = ({
  label,
  isLabelLink,
  amount,
  symbol,
  help,
  showPositive,
  ...props
}) => {
  const theme = useTheme()

  return (
    <div
      css={`
        display: flex;
        align-items: center;
        justify-content: space-between;

        &:last-child {
          margin-bottom: 0;
        }
      `}
      {...props}
    >
      {isLabelLink ? (
        label
      ) : (
        <div
          css={`
            display: flex;
            align-items: center;

            & > button {
              margin-left: ${0.5 * GU}px;
            }
          `}
        >
          <span>{label}</span>
          {help && <Help hint="">{help}</Help>}
        </div>
      )}

      <span
        css={`
          ${showPositive && `color: ${theme.positive}`};
        `}
      >
        {amount} {symbol}
      </span>
    </div>
  )
}

const FeeSection = ({ children }) => {
  const theme = useTheme()
  return (
    <div
      css={`
        padding: ${3 * GU}px;

        & :not(:last-child) {
          border-bottom: 1px solid ${theme.border};
        }
      `}
    >
      {children}
    </div>
  )
}

function getTotalFees(fees, key = 'amount') {
  return Array.isArray(fees)
    ? fees.reduce((acc, fee) => acc.add(fee[key]), bigNum(0))
    : bigNum(0)
}

function getTotalSettledFees(arbitrableFees, appealFees) {
  return [arbitrableFees, appealFees]
    .map(fees => getTotalFees(fees, 'settledAmount'))
    .reduce((acc, amount) => acc.add(amount), bigNum(0))
}

const useTotalFeeRewards = (
  arbitrableFees = [],
  appealFees = [],
  subscriptionFees = []
) => {
  return useMemo(() => {
    const [totalArbitrableFees, totalAppealFees, totalSubscriptionFees] = [
      arbitrableFees,
      appealFees,
      subscriptionFees,
    ].map(fees => getTotalFees(fees))

    const totalSettledFees = getTotalSettledFees(arbitrableFees, appealFees)

    return {
      totalAppealFees,
      totalArbitrableFees,
      totalSettledFees,
      totalSubscriptionFees,
    }
  }, [appealFees, arbitrableFees, subscriptionFees])
}

export default RewardsModule
