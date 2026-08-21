import React from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { FAMILY_LABEL } from '../data/sitterServices'
import { HUB_COPY } from '../data/hubCopy'
import ResubmitButton from '../components/ResubmitButton'
import { PaneTabs, PaneTitle } from '../components/hubUI'

/**
 * The wide-width chrome shared by the two family panes: title row, the family's
 * banners, then the Services | Profile tab bar. Replaces `SubPageHeader`, which
 * is a mobile-only affordance — at this width the sidebar already says where you
 * are, so there is no back chevron.
 *
 * The title is the bare family label ("Pet sitting"), not the mobile
 * `"${label} services"`, and banners from *both* slots stack here between title
 * and tabs rather than splitting above/below their row (Figma 608:55002,
 * 4233:29652). Resubmit sits in the title row per Figma 3399:5777.
 */
export default function FamilyPaneHeader({ family, activeTab }) {
  const navigate = useNavigate()
  const { bannersFor, handleViewProfile, profileReviewStatus, noop } = useOutletContext()

  const tabs = [
    { key: 'services', label: HUB_COPY.familyTabs.services, to: `/service-settings/services/${family}` },
    { key: 'profile',  label: HUB_COPY.familyTabs.profile,  to: `/service-settings/profile/${family}` },
  ]

  return (
    <>
      <PaneTitle
        title={FAMILY_LABEL[family]}
        rightLinkLabel="View profile"
        onRightLink={handleViewProfile(family)}
        rightSlot={
          profileReviewStatus === 'borderline' ? <ResubmitButton onClick={noop} /> : null
        }
      />

      {[...bannersFor(family, 'services'), ...bannersFor(family, 'profile')]}

      <PaneTabs
        tabs={tabs}
        activeKey={activeTab}
        onSelect={(tab) => navigate(tab.to)}
      />
    </>
  )
}
