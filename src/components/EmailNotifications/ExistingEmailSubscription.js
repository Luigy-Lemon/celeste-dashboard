import React from 'react'
import { Button, GU, Link, textStyle, useTheme } from '@1hive/1hive-ui'
import IdentityBadge from '../IdentityBadge'
import { useAsset } from '../../hooks/useAsset'
import { useWallet } from '../../providers/Wallet'
import { EMAIL_NOTIFICATIONS } from '../../utils/asset-utils'

function ExistingEmailSubscription({
  compactMode,
  onOptOut,
  onSubscribeToNotifications,
}) {
  const theme = useTheme()
  const { account } = useWallet()
  const emailNotificationsSvg = useAsset(EMAIL_NOTIFICATIONS)

  return (
    <>
      <div
        css={`
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-top: ${3 * GU}px;
        `}
      >
        <div
          css={`
            display: flex;
            flex-direction: column;
            text-align: center;
          `}
        >
          <div
            css={`
              align-items: center;
            `}
          >
            <img src={emailNotificationsSvg} width={141} height={141} alt="" />
          </div>
          <h3
            css={`
              ${textStyle('title2')};
              margin-top: ${4 * GU}px;
            `}
          >
            Stay up to date with email notifications
          </h3>

          <span
            css={`
              ${textStyle('body2')};
              color: ${theme.surfaceContentSecondary};
              margin-top: ${1.5 * GU}px;
            `}
          >
            <span>We’ve detected an email associated to the account </span>
            <IdentityBadge
              connectedAccount={account}
              entity={account}
              compact
            />
            <span>
              . First, we need to verify that you are in control of this account
              and then, authenticate the email address you provided.
            </span>
          </span>
        </div>
        <span
          css={`
            ${textStyle('body2')};
            color: #9096b6;
            text-align: center;
            margin-top: ${3 * GU}px;
          `}
        >
          You have previously agreed to Celeste's{' '}
          <Link href="https://anj.aragon.org/legal/terms-general.pdf">
            legal terms
          </Link>{' '}
          and{' '}
          <Link href="https://aragon.one/email-collection.md">
            email collection policy
          </Link>
          .
        </span>
        <div
          css={`
            display: flex;
            justify-content: space-between;
            flex-direction: ${compactMode ? 'column' : 'row'};
            width: 100%;
            margin-bottom: ${1.5 * GU}px;
            margin-top: ${3 * GU}px;
          `}
        >
          <ActionButton compactMode={compactMode} onClick={onOptOut}>
            No, thanks
          </ActionButton>
          <ActionButton
            compactMode={compactMode}
            mode="strong"
            onClick={onSubscribeToNotifications}
          >
            Subscribe to notifications
          </ActionButton>
        </div>
      </div>
    </>
  )
}

function ActionButton({ compactMode, ...props }) {
  return (
    <Button
      css={`
        width: ${compactMode ? '100%' : `calc((100% - ${2 * GU}px) /  2)`};
      `}
      {...props}
    />
  )
}

export default ExistingEmailSubscription
